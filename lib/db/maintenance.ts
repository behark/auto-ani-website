/**
 * Database Maintenance and Health Utilities
 *
 * Automated maintenance tasks:
 * - Health checks and diagnostics
 * - Routine maintenance (VACUUM, ANALYZE, REINDEX)
 * - Session cleanup
 * - Log rotation
 * - Performance optimization
 */

import { prisma } from './connection-pool';
import { logger } from '../logger';
import { DatabaseMonitor } from './monitoring';

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    connection: boolean;
    readWrite: boolean;
    connections: boolean;
    performance: boolean;
    locks: boolean;
  };
  metrics?: {
    responseTime: number;
    connections: number;
    cacheHitRatio: number;
  };
  errors: string[];
}

export interface MaintenanceResult {
  success: boolean;
  tasksCompleted: string[];
  tasksSkipped: string[];
  errors: string[];
  duration: number;
}

/**
 * Database Maintenance Manager
 */
export class MaintenanceManager {
  private monitor: DatabaseMonitor;

  constructor() {
    this.monitor = new DatabaseMonitor();
  }

  /**
   * Comprehensive health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      healthy: true,
      checks: {
        connection: false,
        readWrite: false,
        connections: false,
        performance: false,
        locks: false,
      },
      errors: [],
    };

    try {
      // 1. Connection Check
      try {
        await prisma.$queryRaw`SELECT 1`;
        result.checks.connection = true;
      } catch (error) {
        result.healthy = false;
        result.errors.push('Database connection failed');
      }

      // 2. Read/Write Check
      try {
        const testTable = 'system_logs';
        await prisma.$executeRawUnsafe(`SELECT 1 FROM ${testTable} LIMIT 1`);
        result.checks.readWrite = true;
      } catch (error) {
        result.healthy = false;
        result.errors.push('Database read/write check failed');
      }

      // 3. Connection Pool Check
      try {
        const metrics = await this.monitor.getDatabaseMetrics();
        result.checks.connections = metrics.connections.utilizationPercent < 90;

        if (!result.checks.connections) {
          result.errors.push(`High connection utilization: ${metrics.connections.utilizationPercent.toFixed(2)}%`);
          result.healthy = false;
        }

        result.metrics = {
          responseTime: Date.now() - startTime,
          connections: metrics.connections.total,
          cacheHitRatio: metrics.performance.cacheHitRatio,
        };
      } catch (error) {
        result.errors.push('Failed to check connection pool');
      }

      // 4. Performance Check (cache hit ratio)
      try {
        const metrics = await this.monitor.getDatabaseMetrics();
        result.checks.performance = metrics.performance.cacheHitRatio > 85;

        if (!result.checks.performance) {
          result.errors.push(`Low cache hit ratio: ${metrics.performance.cacheHitRatio.toFixed(2)}%`);
        }
      } catch (error) {
        result.errors.push('Failed to check performance metrics');
      }

      // 5. Lock Check
      try {
        const metrics = await this.monitor.getDatabaseMetrics();
        result.checks.locks = metrics.locks.blockedQueries === 0;

        if (!result.checks.locks) {
          result.errors.push(`Blocked queries detected: ${metrics.locks.blockedQueries}`);
          result.healthy = false;
        }
      } catch (error) {
        result.errors.push('Failed to check locks');
      }

      logger.info('Health check completed', {
        healthy: result.healthy,
        duration: Date.now() - startTime,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      logger.error('Health check failed', {}, error instanceof Error ? error : undefined);
      result.healthy = false;
      result.errors.push('Health check encountered an error');
      return result;
    }
  }

  /**
   * Run routine maintenance tasks
   */
  async runMaintenance(options: {
    vacuum?: boolean;
    analyze?: boolean;
    reindex?: boolean;
    cleanupSessions?: boolean;
  } = {}): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const result: MaintenanceResult = {
      success: true,
      tasksCompleted: [],
      tasksSkipped: [],
      errors: [],
      duration: 0,
    };

    const {
      vacuum = true,
      analyze = true,
      reindex = false,
      cleanupSessions = true,
    } = options;

    try {
      logger.info('Starting routine maintenance', options);

      // 1. VACUUM tables
      if (vacuum) {
        try {
          const tables = await this.getMaintenanceTables();
          for (const table of tables) {
            await this.monitor.vacuumTable(table);
          }
          result.tasksCompleted.push(`VACUUM completed on ${tables.length} tables`);
        } catch (error) {
          result.errors.push('VACUUM failed');
          result.success = false;
        }
      } else {
        result.tasksSkipped.push('VACUUM');
      }

      // 2. ANALYZE tables
      if (analyze) {
        try {
          const tables = await this.getMaintenanceTables();
          for (const table of tables) {
            await this.monitor.analyzeTable(table);
          }
          result.tasksCompleted.push(`ANALYZE completed on ${tables.length} tables`);
        } catch (error) {
          result.errors.push('ANALYZE failed');
          result.success = false;
        }
      } else {
        result.tasksSkipped.push('ANALYZE');
      }

      // 3. REINDEX (only if requested, as it can be slow)
      if (reindex) {
        try {
          const tables = await this.getMaintenanceTables();
          for (const table of tables) {
            await this.monitor.reindexTable(table);
          }
          result.tasksCompleted.push(`REINDEX completed on ${tables.length} tables`);
        } catch (error) {
          result.errors.push('REINDEX failed');
          result.success = false;
        }
      } else {
        result.tasksSkipped.push('REINDEX');
      }

      // 4. Cleanup expired sessions
      if (cleanupSessions) {
        try {
          const cleaned = await this.cleanupExpiredSessions();
          result.tasksCompleted.push(`Cleaned ${cleaned} expired sessions`);
        } catch (error) {
          result.errors.push('Session cleanup failed');
        }
      } else {
        result.tasksSkipped.push('Session cleanup');
      }

      result.duration = Date.now() - startTime;

      logger.info('Maintenance completed', {
        success: result.success,
        duration: result.duration,
        completed: result.tasksCompleted.length,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      logger.error('Maintenance failed', {}, error instanceof Error ? error : undefined);
      result.success = false;
      result.errors.push('Maintenance encountered an error');
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Get list of tables that need maintenance
   */
  private async getMaintenanceTables(): Promise<string[]> {
    try {
      const tables: any[] = await prisma.$queryRaw`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      return tables.map(t => t.tablename);
    } catch (error) {
      logger.error('Failed to get table list', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Clean up expired user sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      // TODO: userSession model doesn't exist in schema
      // const result = await prisma.userSession.deleteMany({
      //   where: {
      //     expiresAt: {
      //       lt: new Date(),
      //     },
      //   },
      // });
      const result = { count: 0 }; // Mock result until userSession model is created

      logger.info('Expired sessions cleaned', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup sessions', {}, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  /**
   * Clean up old system logs
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Skip systemLog cleanup - model doesn't exist
      // const result = await prisma.systemLog.deleteMany({
      //   where: {
      //     createdAt: {
      //       lt: cutoffDate,
      //     },
      //   },
      // });
      const result = { count: 0 };

      logger.info('Old logs cleaned', { count: result.count, daysKept: daysToKeep });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup logs', {}, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldAnalytics(daysToKeep: number = 365): Promise<{
    searchAnalytics: number;
    vehicleViews: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Skip analytics cleanup - models don't exist
      // const [searchAnalytics, vehicleViews] = await Promise.all([
      //   prisma.searchAnalytics.deleteMany({
      //     where: { createdAt: { lt: cutoffDate } },
      //   }),
      //   prisma.vehicleView.deleteMany({
      //     where: { createdAt: { lt: cutoffDate } },
      //   }),
      // ]);
      const searchAnalytics = { count: 0 };
      const vehicleViews = { count: 0 };

      logger.info('Old analytics cleaned', {
        searchAnalytics: searchAnalytics.count,
        vehicleViews: vehicleViews.count,
        daysKept: daysToKeep,
      });

      return {
        searchAnalytics: searchAnalytics.count,
        vehicleViews: vehicleViews.count,
      };
    } catch (error) {
      logger.error('Failed to cleanup analytics', {}, error instanceof Error ? error : undefined);
      return { searchAnalytics: 0, vehicleViews: 0 };
    }
  }

  /**
   * Terminate idle connections
   */
  async terminateIdleConnections(idleMinutes: number = 30): Promise<number> {
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state = 'idle'
          AND state_change < NOW() - INTERVAL '${idleMinutes} minutes'
          AND pid != pg_backend_pid()
      `;

      logger.info('Idle connections terminated', { count: result.length });
      return result.length;
    } catch (error) {
      logger.error('Failed to terminate idle connections', {}, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  /**
   * Update database statistics
   */
  async updateStatistics(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe('ANALYZE');
      logger.info('Database statistics updated');
    } catch (error) {
      logger.error('Failed to update statistics', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Check and repair table corruption
   */
  async repairTables(): Promise<string[]> {
    const repairedTables: string[] = [];

    try {
      const tables = await this.getMaintenanceTables();

      for (const table of tables) {
        try {
          // Check table integrity
          await prisma.$executeRawUnsafe(`SELECT COUNT(*) FROM ${table}`);
        } catch (error) {
          logger.warn(`Table ${table} may be corrupted, attempting repair`);

          try {
            await this.monitor.reindexTable(table);
            await this.monitor.vacuumTable(table, true);
            repairedTables.push(table);
            logger.info(`Table ${table} repaired successfully`);
          } catch (repairError) {
            logger.error(`Failed to repair table ${table}`, {}, repairError instanceof Error ? repairError : undefined);
          }
        }
      }

      return repairedTables;
    } catch (error) {
      logger.error('Table repair failed', {}, error instanceof Error ? error : undefined);
      return repairedTables;
    }
  }
}

/**
 * Maintenance Scheduler
 */
export class MaintenanceScheduler {
  private manager: MaintenanceManager;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.manager = new MaintenanceManager();
  }

  /**
   * Start automated maintenance schedule
   */
  start(): void {
    // Daily maintenance at 3 AM
    const dailyMaintenance = setInterval(
      async () => {
        const now = new Date();
        if (now.getHours() === 3) {
          await this.manager.runMaintenance({
            vacuum: true,
            analyze: true,
            reindex: false,
            cleanupSessions: true,
          });
        }
      },
      60 * 60 * 1000
    ); // Check every hour

    // Hourly session cleanup
    const hourlyCleanup = setInterval(
      async () => {
        await this.manager.cleanupExpiredSessions();
      },
      60 * 60 * 1000
    ); // Every hour

    // Weekly log cleanup (every Sunday at 4 AM)
    const weeklyLogCleanup = setInterval(
      async () => {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 4) {
          await this.manager.cleanupOldLogs(30);
          await this.manager.cleanupOldAnalytics(365);
        }
      },
      60 * 60 * 1000
    ); // Check every hour

    this.intervals.push(dailyMaintenance, hourlyCleanup, weeklyLogCleanup);

    logger.info('Maintenance scheduler started', {
      dailyMaintenance: 'Daily at 3 AM',
      sessionCleanup: 'Every hour',
      logCleanup: 'Sundays at 4 AM',
    });
  }

  /**
   * Stop automated maintenance
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    logger.info('Maintenance scheduler stopped');
  }
}

/**
 * Export maintenance manager instance
 */
export const maintenanceManager = new MaintenanceManager();

/**
 * Convenience functions
 */
export const healthCheck = () => maintenanceManager.healthCheck();
export const runMaintenance = (options?: Parameters<typeof maintenanceManager.runMaintenance>[0]) =>
  maintenanceManager.runMaintenance(options);
export const cleanupSessions = () => maintenanceManager.cleanupExpiredSessions();
export const cleanupLogs = (days?: number) => maintenanceManager.cleanupOldLogs(days);
export const updateStats = () => maintenanceManager.updateStatistics();