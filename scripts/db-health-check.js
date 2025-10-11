#!/usr/bin/env node

/**
 * Database Health Check & Performance Monitor
 * Comprehensive database diagnostics and optimization recommendations
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

class DatabaseHealthCheck {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
    });
    this.results = {
      status: 'healthy',
      checks: [],
      recommendations: [],
      metrics: {},
    };
  }

  async run() {
    log('\n====================================', 'cyan');
    log('  DATABASE HEALTH CHECK & MONITOR', 'bright');
    log('====================================\n', 'cyan');

    try {
      await this.checkConnection();
      await this.checkDatabaseInfo();
      await this.checkTableSizes();
      await this.checkIndexUsage();
      await this.checkSlowQueries();
      await this.checkConnectionPool();
      await this.checkCacheHitRatio();
      await this.checkVacuumStatus();
      await this.generateRecommendations();
      this.printSummary();
    } catch (error) {
      log(`❌ Health check failed: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async checkConnection() {
    log('1. Checking database connection...', 'yellow');

    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      this.results.metrics.latency = latency;

      if (latency < 50) {
        log(`   ✅ Connection latency: ${latency}ms (Excellent)`, 'green');
      } else if (latency < 200) {
        log(`   ✅ Connection latency: ${latency}ms (Good)`, 'green');
      } else {
        log(`   ⚠️  Connection latency: ${latency}ms (High)`, 'yellow');
        this.results.recommendations.push('Consider using connection pooling or moving database closer to application');
      }

      this.results.checks.push({
        name: 'Connection',
        status: 'passed',
        details: `Latency: ${latency}ms`,
      });
    } catch (error) {
      this.results.status = 'critical';
      this.results.checks.push({
        name: 'Connection',
        status: 'failed',
        details: error.message,
      });
      throw error;
    }
  }

  async checkDatabaseInfo() {
    log('\n2. Database information...', 'yellow');

    try {
      // Database version
      const versionResult = await this.prisma.$queryRaw`SELECT version()`;
      const version = versionResult[0]?.version || 'Unknown';
      log(`   PostgreSQL: ${version.split(' ').slice(0, 2).join(' ')}`, 'cyan');

      // Database size
      const sizeResult = await this.prisma.$queryRaw`
        SELECT pg_database_size(current_database()) as size,
               current_database() as name
      `;
      const dbSize = formatBytes(Number(sizeResult[0].size));
      const dbName = sizeResult[0].name;

      log(`   Database: ${dbName}`, 'cyan');
      log(`   Total size: ${dbSize}`, 'cyan');

      this.results.metrics.databaseSize = sizeResult[0].size;
      this.results.metrics.databaseName = dbName;

      // Check if size is approaching limits for free tiers
      const sizeInMB = Number(sizeResult[0].size) / 1024 / 1024;
      if (sizeInMB > 400) {
        // Approaching 500MB limit
        this.results.recommendations.push('Database size approaching free tier limit - consider upgrading or cleaning old data');
      }

      this.results.checks.push({
        name: 'Database Info',
        status: 'passed',
        details: `Size: ${dbSize}`,
      });
    } catch (error) {
      log(`   ❌ Failed to get database info: ${error.message}`, 'red');
    }
  }

  async checkTableSizes() {
    log('\n3. Analyzing table sizes...', 'yellow');

    try {
      const tables = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
          n_live_tup AS row_count
        FROM pg_tables
        LEFT JOIN pg_stat_user_tables ON tablename = relname
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;

      log('   Top tables by size:', 'cyan');
      tables.forEach((table, index) => {
        const rowCount = formatNumber(table.row_count || 0);
        log(`   ${index + 1}. ${table.tablename}: ${table.size} (${rowCount} rows)`, 'blue');

        // Check for bloated tables
        if (table.row_count && table.row_count > 10000) {
          const avgRowSize = table.size_bytes / table.row_count;
          if (avgRowSize > 10000) {
            // More than 10KB per row might indicate bloat
            this.results.recommendations.push(`Table '${table.tablename}' might be bloated - consider VACUUM FULL`);
          }
        }
      });

      this.results.metrics.largestTable = tables[0]?.tablename;
      this.results.metrics.largestTableSize = tables[0]?.size;
    } catch (error) {
      log(`   ⚠️  Could not analyze table sizes: ${error.message}`, 'yellow');
    }
  }

  async checkIndexUsage() {
    log('\n4. Checking index usage...', 'yellow');

    try {
      // Unused indexes
      const unusedIndexes = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) AS size
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
          AND indexrelname NOT LIKE '%_pkey'
          AND schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
      `;

      if (unusedIndexes.length > 0) {
        log(`   ⚠️  Found ${unusedIndexes.length} unused indexes:`, 'yellow');
        unusedIndexes.forEach(idx => {
          log(`      - ${idx.tablename}.${idx.indexname} (${idx.size})`, 'yellow');
        });
        this.results.recommendations.push('Consider removing unused indexes to save space and improve write performance');
      } else {
        log('   ✅ All indexes are being used', 'green');
      }

      // Missing indexes (tables with sequential scans)
      const seqScans = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_live_tup
        FROM pg_stat_user_tables
        WHERE seq_scan > idx_scan * 2
          AND n_live_tup > 1000
          AND schemaname = 'public'
        ORDER BY seq_tup_read DESC
        LIMIT 5
      `;

      if (seqScans.length > 0) {
        log(`   ⚠️  Tables with high sequential scans:`, 'yellow');
        seqScans.forEach(table => {
          const ratio = (table.seq_scan / (table.idx_scan || 1)).toFixed(2);
          log(`      - ${table.tablename}: ${ratio}x more seq scans than index scans`, 'yellow');
        });
        this.results.recommendations.push('Consider adding indexes to tables with high sequential scan rates');
      }

      this.results.checks.push({
        name: 'Index Usage',
        status: unusedIndexes.length === 0 ? 'passed' : 'warning',
        details: `${unusedIndexes.length} unused indexes found`,
      });
    } catch (error) {
      log(`   ⚠️  Could not analyze index usage: ${error.message}`, 'yellow');
    }
  }

  async checkSlowQueries() {
    log('\n5. Checking for slow queries...', 'yellow');

    try {
      // Check if pg_stat_statements is available
      const extensions = await this.prisma.$queryRaw`
        SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements'
      `;

      if (extensions.length > 0) {
        const slowQueries = await this.prisma.$queryRaw`
          SELECT
            substring(query, 1, 100) as query_preview,
            mean_exec_time,
            calls,
            total_exec_time
          FROM pg_stat_statements
          WHERE mean_exec_time > 100
          ORDER BY mean_exec_time DESC
          LIMIT 5
        `;

        if (slowQueries.length > 0) {
          log('   ⚠️  Slow queries detected:', 'yellow');
          slowQueries.forEach((q, i) => {
            log(`   ${i + 1}. ${q.query_preview}...`, 'yellow');
            log(`      Mean time: ${q.mean_exec_time.toFixed(2)}ms, Calls: ${q.calls}`, 'dim');
          });
          this.results.recommendations.push('Optimize slow queries - consider adding indexes or rewriting queries');
        } else {
          log('   ✅ No slow queries detected', 'green');
        }
      } else {
        log('   ℹ️  pg_stat_statements extension not available', 'cyan');
      }
    } catch (error) {
      log('   ℹ️  Cannot check slow queries (may require additional permissions)', 'cyan');
    }
  }

  async checkConnectionPool() {
    log('\n6. Checking connection pool...', 'yellow');

    try {
      const connections = await this.prisma.$queryRaw`
        SELECT
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          count(*) as total,
          max(query_start) as oldest_query_start
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const conn = connections[0];
      log(`   Active connections: ${conn.active}`, 'cyan');
      log(`   Idle connections: ${conn.idle}`, 'cyan');
      log(`   Idle in transaction: ${conn.idle_in_transaction}`, 'cyan');
      log(`   Total connections: ${conn.total}`, 'cyan');

      this.results.metrics.connections = {
        active: Number(conn.active),
        idle: Number(conn.idle),
        total: Number(conn.total),
      };

      // Check for connection leaks
      if (conn.idle_in_transaction > 0) {
        this.results.recommendations.push('Found idle transactions - check for connection leaks in application');
      }

      // Check connection limits
      const maxConnections = await this.prisma.$queryRaw`
        SELECT setting FROM pg_settings WHERE name = 'max_connections'
      `;

      const maxConn = parseInt(maxConnections[0].setting);
      const usagePercent = (conn.total / maxConn * 100).toFixed(1);

      log(`   Max connections: ${maxConn} (${usagePercent}% used)`, 'cyan');

      if (usagePercent > 80) {
        this.results.recommendations.push('High connection usage - consider connection pooling or increasing limits');
      }

      this.results.checks.push({
        name: 'Connection Pool',
        status: usagePercent < 80 ? 'passed' : 'warning',
        details: `${usagePercent}% of max connections used`,
      });
    } catch (error) {
      log(`   ⚠️  Could not check connections: ${error.message}`, 'yellow');
    }
  }

  async checkCacheHitRatio() {
    log('\n7. Checking cache performance...', 'yellow');

    try {
      const cacheStats = await this.prisma.$queryRaw`
        SELECT
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as hit_ratio
        FROM pg_statio_user_tables
      `;

      const hitRatio = (cacheStats[0].hit_ratio * 100).toFixed(2);

      if (hitRatio > 95) {
        log(`   ✅ Cache hit ratio: ${hitRatio}% (Excellent)`, 'green');
      } else if (hitRatio > 90) {
        log(`   ✅ Cache hit ratio: ${hitRatio}% (Good)`, 'green');
      } else {
        log(`   ⚠️  Cache hit ratio: ${hitRatio}% (Low)`, 'yellow');
        this.results.recommendations.push('Low cache hit ratio - consider increasing shared_buffers or adding more RAM');
      }

      this.results.metrics.cacheHitRatio = parseFloat(hitRatio);

      this.results.checks.push({
        name: 'Cache Performance',
        status: hitRatio > 90 ? 'passed' : 'warning',
        details: `${hitRatio}% hit ratio`,
      });
    } catch (error) {
      log(`   ⚠️  Could not check cache stats: ${error.message}`, 'yellow');
    }
  }

  async checkVacuumStatus() {
    log('\n8. Checking vacuum status...', 'yellow');

    try {
      const vacuumStats = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          n_dead_tup,
          n_live_tup,
          CASE WHEN n_live_tup > 0
            THEN (n_dead_tup::float / n_live_tup::float * 100)
            ELSE 0
          END as dead_tuple_percent
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND n_live_tup > 1000
        ORDER BY dead_tuple_percent DESC
        LIMIT 5
      `;

      let needsVacuum = false;
      vacuumStats.forEach(table => {
        if (table.dead_tuple_percent > 20) {
          log(`   ⚠️  ${table.tablename}: ${table.dead_tuple_percent.toFixed(1)}% dead tuples`, 'yellow');
          needsVacuum = true;
        }
      });

      if (needsVacuum) {
        this.results.recommendations.push('High dead tuple percentage - run VACUUM to reclaim space');
      } else {
        log('   ✅ Tables are properly vacuumed', 'green');
      }

      // Check autovacuum settings
      const autovacuumEnabled = await this.prisma.$queryRaw`
        SELECT setting FROM pg_settings WHERE name = 'autovacuum'
      `;

      if (autovacuumEnabled[0].setting === 'on') {
        log('   ✅ Autovacuum is enabled', 'green');
      } else {
        log('   ⚠️  Autovacuum is disabled', 'yellow');
        this.results.recommendations.push('Enable autovacuum for automatic maintenance');
      }
    } catch (error) {
      log(`   ⚠️  Could not check vacuum status: ${error.message}`, 'yellow');
    }
  }

  generateRecommendations() {
    log('\n9. Generating optimization recommendations...', 'yellow');

    // Add general recommendations based on metrics
    if (this.results.metrics.databaseSize > 400 * 1024 * 1024) {
      this.results.recommendations.push('Database approaching size limits - archive old data or upgrade plan');
    }

    if (this.results.metrics.latency > 100) {
      this.results.recommendations.push('High network latency - use connection pooling and batch queries');
    }

    // Remove duplicates
    this.results.recommendations = [...new Set(this.results.recommendations)];
  }

  printSummary() {
    log('\n====================================', 'cyan');
    log('  HEALTH CHECK SUMMARY', 'bright');
    log('====================================\n', 'cyan');

    // Overall status
    const failedChecks = this.results.checks.filter(c => c.status === 'failed').length;
    const warningChecks = this.results.checks.filter(c => c.status === 'warning').length;

    if (failedChecks > 0) {
      log(`Status: ❌ CRITICAL (${failedChecks} failed checks)`, 'red');
    } else if (warningChecks > 0) {
      log(`Status: ⚠️  WARNING (${warningChecks} warnings)`, 'yellow');
    } else {
      log('Status: ✅ HEALTHY', 'green');
    }

    // Check results
    log('\nCheck Results:', 'yellow');
    this.results.checks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' :
                   check.status === 'warning' ? '⚠️' : '❌';
      const color = check.status === 'passed' ? 'green' :
                    check.status === 'warning' ? 'yellow' : 'red';
      log(`  ${icon} ${check.name}: ${check.details}`, color);
    });

    // Key metrics
    log('\nKey Metrics:', 'yellow');
    log(`  Database Size: ${formatBytes(this.results.metrics.databaseSize || 0)}`, 'cyan');
    log(`  Connection Latency: ${this.results.metrics.latency}ms`, 'cyan');
    log(`  Cache Hit Ratio: ${this.results.metrics.cacheHitRatio || 0}%`, 'cyan');
    log(`  Active Connections: ${this.results.metrics.connections?.active || 0}`, 'cyan');

    // Recommendations
    if (this.results.recommendations.length > 0) {
      log('\n📋 Optimization Recommendations:', 'yellow');
      this.results.recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`, 'cyan');
      });
    } else {
      log('\n✨ No optimization recommendations - database is well optimized!', 'green');
    }

    // Export results
    const resultsFile = path.join(__dirname, '..', 'health-check-results.json');
    require('fs').writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    log(`\n📊 Full results saved to: ${resultsFile}`, 'dim');
  }
}

// Run health check
const healthCheck = new DatabaseHealthCheck();
healthCheck.run().catch(console.error);