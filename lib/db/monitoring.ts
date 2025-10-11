/**
 * Database Performance Monitoring and Query Analytics
 *
 * Features:
 * - Query performance tracking and slow query detection
 * - Connection pool monitoring
 * - Index usage analysis
 * - Table statistics and bloat detection
 * - Query optimization recommendations
 * - Real-time performance metrics
 */

import { prisma } from './connection-pool';
import { logger } from '../logger';

export interface QueryStats {
  query: string;
  totalCalls: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  rows: number;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  totalSize: string;
  indexSize: string;
  tableSize: string;
  bloatRatio?: number;
}

export interface IndexUsageStats {
  tableName: string;
  indexName: string;
  indexSize: string;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  isUnused: boolean;
}

export interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
    maxConnections: number;
    utilizationPercent: number;
  };
  transactions: {
    commitsPerSecond: number;
    rollbacksPerSecond: number;
    activeTransactions: number;
    oldestTransaction?: {
      age: string;
      query: string;
    };
  };
  performance: {
    cacheHitRatio: number;
    tuplesRead: number;
    tuplesReturned: number;
    tuplesInserted: number;
    tuplesUpdated: number;
    tuplesDeleted: number;
  };
  locks: {
    totalLocks: number;
    blockedQueries: number;
  };
}

/**
 * Database Performance Monitor
 */
export class DatabaseMonitor {
  /**
   * Get slow queries (queries taking longer than threshold)
   */
  async getSlowQueries(thresholdMs: number = 1000): Promise<QueryStats[]> {
    try {
      const queries: any[] = await prisma.$queryRaw`
        SELECT
          query,
          calls as total_calls,
          total_exec_time as total_time,
          mean_exec_time as avg_time,
          min_exec_time as min_time,
          max_exec_time as max_time,
          rows
        FROM pg_stat_statements
        WHERE mean_exec_time > ${thresholdMs}
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `;

      return queries.map(q => ({
        query: q.query,
        totalCalls: Number(q.total_calls),
        totalTime: Number(q.total_time),
        avgTime: Number(q.avg_time),
        minTime: Number(q.min_time),
        maxTime: Number(q.max_time),
        rows: Number(q.rows),
      }));
    } catch (error) {
      // pg_stat_statements extension might not be enabled
      logger.warn('Unable to fetch slow queries - pg_stat_statements extension may not be enabled');
      return [];
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<TableStats[]> {
    try {
      const stats: any[] = await prisma.$queryRaw`
        SELECT
          schemaname || '.' || tablename as table_name,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
          pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) as index_size,
          pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      `;

      return stats.map(s => ({
        tableName: s.table_name,
        rowCount: Number(s.row_count),
        totalSize: s.total_size,
        indexSize: s.index_size,
        tableSize: s.table_size,
      }));
    } catch (error) {
      logger.error('Failed to get table stats', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsage(): Promise<IndexUsageStats[]> {
    try {
      const indexes: any[] = await prisma.$queryRaw`
        SELECT
          schemaname || '.' || tablename as table_name,
          indexrelname as index_name,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
      `;

      return indexes.map(i => ({
        tableName: i.table_name,
        indexName: i.index_name,
        indexSize: i.index_size,
        scans: Number(i.scans),
        tuplesRead: Number(i.tuples_read),
        tuplesFetched: Number(i.tuples_fetched),
        isUnused: Number(i.scans) === 0,
      }));
    } catch (error) {
      logger.error('Failed to get index usage', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Get unused indexes (candidates for removal)
   */
  async getUnusedIndexes(): Promise<IndexUsageStats[]> {
    const allIndexes = await this.getIndexUsage();
    return allIndexes.filter(idx => idx.isUnused && idx.scans === 0);
  }

  /**
   * Get comprehensive database metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Connection stats
      const connectionStats: any = await prisma.$queryRaw`
        SELECT
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE wait_event_type = 'Client') as waiting,
          count(*) as total,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const connStats = connectionStats[0];
      const active = Number(connStats.active || 0);
      const idle = Number(connStats.idle || 0);
      const waiting = Number(connStats.waiting || 0);
      const total = Number(connStats.total || 0);
      const maxConnections = Number(connStats.max_connections || 100);

      // Transaction stats
      const txStats: any = await prisma.$queryRaw`
        SELECT
          xact_commit,
          xact_rollback,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query NOT LIKE '%pg_stat%') as active_tx
        FROM pg_stat_database
        WHERE datname = current_database()
      `;

      // Oldest transaction
      const oldestTx: any = await prisma.$queryRaw`
        SELECT
          NOW() - xact_start as age,
          LEFT(query, 100) as query
        FROM pg_stat_activity
        WHERE state = 'active' AND xact_start IS NOT NULL
        ORDER BY xact_start
        LIMIT 1
      `;

      // Cache hit ratio
      const cacheStats: any = await prisma.$queryRaw`
        SELECT
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as ratio
        FROM pg_statio_user_tables
      `;

      // Performance metrics
      const perfStats: any = await prisma.$queryRaw`
        SELECT
          tup_fetched,
          tup_returned,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database
        WHERE datname = current_database()
      `;

      // Lock stats
      const lockStats: any = await prisma.$queryRaw`
        SELECT
          count(*) as total_locks,
          count(*) FILTER (WHERE NOT granted) as blocked
        FROM pg_locks
      `;

      const tx = txStats[0];
      const cache = cacheStats[0];
      const perf = perfStats[0];
      const locks = lockStats[0];

      return {
        connections: {
          active,
          idle,
          waiting,
          total,
          maxConnections,
          utilizationPercent: (total / maxConnections) * 100,
        },
        transactions: {
          commitsPerSecond: Number(tx.xact_commit || 0),
          rollbacksPerSecond: Number(tx.xact_rollback || 0),
          activeTransactions: Number(tx.active_tx || 0),
          oldestTransaction: oldestTx[0]
            ? {
                age: oldestTx[0].age,
                query: oldestTx[0].query,
              }
            : undefined,
        },
        performance: {
          cacheHitRatio: Number(cache.ratio || 0) * 100,
          tuplesRead: Number(perf.tup_fetched || 0),
          tuplesReturned: Number(perf.tup_returned || 0),
          tuplesInserted: Number(perf.tup_inserted || 0),
          tuplesUpdated: Number(perf.tup_updated || 0),
          tuplesDeleted: Number(perf.tup_deleted || 0),
        },
        locks: {
          totalLocks: Number(locks.total_locks || 0),
          blockedQueries: Number(locks.blocked || 0),
        },
      };
    } catch (error) {
      logger.error('Failed to get database metrics', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get active queries and their execution time
   */
  async getActiveQueries(): Promise<
    Array<{
      pid: number;
      duration: string;
      query: string;
      state: string;
      waitEvent?: string;
    }>
  > {
    try {
      const queries: any[] = await prisma.$queryRaw`
        SELECT
          pid,
          NOW() - query_start as duration,
          LEFT(query, 200) as query,
          state,
          wait_event
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND query NOT LIKE '%pg_stat_activity%'
          AND query NOT LIKE '%FROM information_schema%'
        ORDER BY query_start
      `;

      return queries.map(q => ({
        pid: Number(q.pid),
        duration: q.duration,
        query: q.query,
        state: q.state,
        waitEvent: q.wait_event,
      }));
    } catch (error) {
      logger.error('Failed to get active queries', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Get blocking queries (queries waiting on locks)
   */
  async getBlockingQueries(): Promise<
    Array<{
      blocked_pid: number;
      blocked_query: string;
      blocking_pid: number;
      blocking_query: string;
      duration: string;
    }>
  > {
    try {
      const blocking: any[] = await prisma.$queryRaw`
        SELECT
          blocked_locks.pid AS blocked_pid,
          LEFT(blocked_activity.query, 100) AS blocked_query,
          blocking_locks.pid AS blocking_pid,
          LEFT(blocking_activity.query, 100) AS blocking_query,
          NOW() - blocked_activity.query_start AS duration
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted
      `;

      return blocking.map(b => ({
        blocked_pid: Number(b.blocked_pid),
        blocked_query: b.blocked_query,
        blocking_pid: Number(b.blocking_pid),
        blocking_query: b.blocking_query,
        duration: b.duration,
      }));
    } catch (error) {
      logger.error('Failed to get blocking queries', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Analyze query and get execution plan
   */
  async explainQuery(query: string): Promise<any[]> {
    try {
      const plan = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
      return plan as any[];
    } catch (error) {
      logger.error('Failed to explain query', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get table bloat estimates
   */
  async getTableBloat(): Promise<
    Array<{
      tableName: string;
      realSize: string;
      extraSize: string;
      bloatPercent: number;
      wastedBytes: number;
    }>
  > {
    try {
      const bloat: any[] = await prisma.$queryRaw`
        SELECT
          schemaname || '.' || tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as real_size,
          pg_size_pretty((pg_total_relation_size(schemaname || '.' || tablename) -
            (n_live_tup * (current_setting('block_size')::integer / 8)))::bigint) as extra_size,
          ROUND(
            ((pg_total_relation_size(schemaname || '.' || tablename)::float -
            (n_live_tup * (current_setting('block_size')::integer / 8))::float) /
            NULLIF(pg_total_relation_size(schemaname || '.' || tablename)::float, 0)) * 100, 2
          ) as bloat_percent,
          (pg_total_relation_size(schemaname || '.' || tablename) -
            (n_live_tup * (current_setting('block_size')::integer / 8)))::bigint as wasted_bytes
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND n_live_tup > 0
        ORDER BY wasted_bytes DESC
        LIMIT 20
      `;

      return bloat.map(b => ({
        tableName: b.table_name,
        realSize: b.real_size,
        extraSize: b.extra_size,
        bloatPercent: Number(b.bloat_percent),
        wastedBytes: Number(b.wasted_bytes),
      }));
    } catch (error) {
      logger.warn('Failed to calculate table bloat');
      return [];
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      // Check cache hit ratio
      const metrics = await this.getDatabaseMetrics();
      if (metrics.performance.cacheHitRatio < 90) {
        recommendations.push(
          `Cache hit ratio is low (${metrics.performance.cacheHitRatio.toFixed(2)}%). Consider increasing shared_buffers.`
        );
      }

      // Check connection utilization
      if (metrics.connections.utilizationPercent > 80) {
        recommendations.push(
          `Connection pool utilization is high (${metrics.connections.utilizationPercent.toFixed(2)}%). Consider connection pooling or increasing max_connections.`
        );
      }

      // Check for blocking queries
      if (metrics.locks.blockedQueries > 0) {
        recommendations.push(
          `Found ${metrics.locks.blockedQueries} blocked queries. Review long-running transactions and consider query optimization.`
        );
      }

      // Check for unused indexes
      const unusedIndexes = await this.getUnusedIndexes();
      if (unusedIndexes.length > 0) {
        recommendations.push(
          `Found ${unusedIndexes.length} unused indexes. Consider removing them to improve write performance: ${unusedIndexes
            .slice(0, 3)
            .map(i => i.indexName)
            .join(', ')}`
        );
      }

      // Check for table bloat
      const bloat = await this.getTableBloat();
      const significantBloat = bloat.filter(b => b.bloatPercent > 20);
      if (significantBloat.length > 0) {
        recommendations.push(
          `Found ${significantBloat.length} tables with significant bloat. Consider running VACUUM FULL on: ${significantBloat
            .slice(0, 3)
            .map(b => b.tableName)
            .join(', ')}`
        );
      }

      // Check slow queries
      const slowQueries = await this.getSlowQueries(1000);
      if (slowQueries.length > 0) {
        recommendations.push(
          `Found ${slowQueries.length} slow queries (>1s avg). Review and optimize query performance.`
        );
      }

      if (recommendations.length === 0) {
        recommendations.push('Database performance looks good! No immediate recommendations.');
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate recommendations', {}, error instanceof Error ? error : undefined);
      return ['Unable to generate recommendations due to an error.'];
    }
  }

  /**
   * Run VACUUM on specified table
   */
  async vacuumTable(tableName: string, full: boolean = false): Promise<void> {
    try {
      const command = full ? `VACUUM FULL ANALYZE ${tableName}` : `VACUUM ANALYZE ${tableName}`;
      await prisma.$executeRawUnsafe(command);
      logger.info('VACUUM completed', { tableName, full });
    } catch (error) {
      logger.error('VACUUM failed', { tableName }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Run ANALYZE on specified table to update statistics
   */
  async analyzeTable(tableName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`ANALYZE ${tableName}`);
      logger.info('ANALYZE completed', { tableName });
    } catch (error) {
      logger.error('ANALYZE failed', { tableName }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * REINDEX table
   */
  async reindexTable(tableName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`REINDEX TABLE ${tableName}`);
      logger.info('REINDEX completed', { tableName });
    } catch (error) {
      logger.error('REINDEX failed', { tableName }, error instanceof Error ? error : undefined);
      throw error;
    }
  }
}

/**
 * Performance monitoring scheduler
 */
export class MonitoringScheduler {
  private monitor: DatabaseMonitor;
  private interval?: NodeJS.Timeout;

  constructor() {
    this.monitor = new DatabaseMonitor();
  }

  /**
   * Start periodic monitoring
   */
  start(intervalMinutes: number = 5): void {
    this.interval = setInterval(async () => {
      try {
        const metrics = await this.monitor.getDatabaseMetrics();

        // Log metrics
        logger.info('Database metrics', {
          connections: metrics.connections,
          cacheHitRatio: metrics.performance.cacheHitRatio,
          activeTransactions: metrics.transactions.activeTransactions,
          blockedQueries: metrics.locks.blockedQueries,
        });

        // Check for issues
        if (metrics.connections.utilizationPercent > 90) {
          logger.warn('High connection pool utilization', {
            utilization: metrics.connections.utilizationPercent,
          });
        }

        if (metrics.locks.blockedQueries > 0) {
          logger.warn('Blocked queries detected', {
            count: metrics.locks.blockedQueries,
          });
        }

        if (metrics.performance.cacheHitRatio < 85) {
          logger.warn('Low cache hit ratio', {
            ratio: metrics.performance.cacheHitRatio,
          });
        }
      } catch (error) {
        logger.error('Monitoring failed', {}, error instanceof Error ? error : undefined);
      }
    }, intervalMinutes * 60 * 1000);

    logger.info('Database monitoring started', { intervalMinutes });
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
      logger.info('Database monitoring stopped');
    }
  }
}

/**
 * Export monitor instance
 */
export const dbMonitor = new DatabaseMonitor();

/**
 * Convenience functions
 */
export const getSlowQueries = (threshold?: number) => dbMonitor.getSlowQueries(threshold);
export const getTableStats = () => dbMonitor.getTableStats();
export const getIndexUsage = () => dbMonitor.getIndexUsage();
export const getUnusedIndexes = () => dbMonitor.getUnusedIndexes();
export const getDatabaseMetrics = () => dbMonitor.getDatabaseMetrics();
export const getRecommendations = () => dbMonitor.generateRecommendations();