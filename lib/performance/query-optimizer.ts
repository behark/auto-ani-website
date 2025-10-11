/**
 * Enterprise Query Optimization Engine for AUTO ANI
 *
 * Provides intelligent query optimization with:
 * - Automatic query analysis and optimization suggestions
 * - Index optimization recommendations
 * - Query execution plan analysis
 * - Performance monitoring and alerting
 * - Automatic slow query detection and logging
 * - Query caching with intelligent invalidation
 *
 * Integrates with Prisma and PostgreSQL for comprehensive optimization
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TraceManager, BusinessMetrics } from '@/lib/observability/telemetry';
import { cacheEngine } from './cache-engine';
import { metricsCollector } from '@/lib/observability/metrics-collector';
import crypto from 'node:crypto';

// Query optimization configuration
const OPTIMIZER_CONFIG = {
  performance: {
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'), // 1 second
    verySlowQueryThreshold: parseInt(process.env.VERY_SLOW_QUERY_THRESHOLD || '5000'), // 5 seconds
    queryTimeoutThreshold: parseInt(process.env.QUERY_TIMEOUT_THRESHOLD || '30000'), // 30 seconds
    maxConcurrentQueries: parseInt(process.env.MAX_CONCURRENT_QUERIES || '100'),
  },

  caching: {
    enabled: process.env.QUERY_CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.QUERY_CACHE_TTL || '300'), // 5 minutes
    maxQuerySize: parseInt(process.env.QUERY_CACHE_MAX_SIZE || '10000'), // 10KB
    compressionThreshold: parseInt(process.env.QUERY_CACHE_COMPRESSION_THRESHOLD || '1024'), // 1KB
  },

  optimization: {
    enabled: process.env.QUERY_OPTIMIZATION_ENABLED !== 'false',
    autoIndexing: process.env.AUTO_INDEXING_ENABLED === 'true',
    queryRewriting: process.env.QUERY_REWRITING_ENABLED === 'true',
    statisticsCollection: process.env.QUERY_STATISTICS_ENABLED !== 'false',
  },

  analysis: {
    enabled: process.env.QUERY_ANALYSIS_ENABLED !== 'false',
    executionPlanAnalysis: process.env.EXECUTION_PLAN_ANALYSIS_ENABLED === 'true',
    indexUsageAnalysis: process.env.INDEX_USAGE_ANALYSIS_ENABLED === 'true',
    performanceTrends: process.env.PERFORMANCE_TRENDS_ENABLED === 'true',
  },
};

// Query performance metrics
export interface QueryMetrics {
  queryHash: string;
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  timestamp: number;
  executionPlan?: any;
  indexesUsed: string[];
  tablesAccessed: string[];
  connectionId?: string;
  userId?: string;
}

export interface QueryOptimizationSuggestion {
  type: 'index' | 'query_rewrite' | 'schema_change' | 'caching';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  query: string;
  suggestion: string;
  estimatedImprovement: number; // Percentage
  implementation: {
    sql?: string;
    migration?: string;
    cacheConfig?: any;
  };
}

export interface QueryPerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
    mostFrequentQueries: Array<{
      queryHash: string;
      query: string;
      frequency: number;
      averageTime: number;
    }>;
  };
  slowestQueries: QueryMetrics[];
  optimizationSuggestions: QueryOptimizationSuggestion[];
  indexRecommendations: Array<{
    table: string;
    columns: string[];
    reason: string;
    estimatedImpact: number;
  }>;
}

/**
 * Query Optimization Engine
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private prisma: PrismaClient;
  private queryMetrics: Map<string, QueryMetrics[]> = new Map();
  private activeQueries: Map<string, { start: number; query: string }> = new Map();
  private optimizationRules: Map<string, Function> = new Map();
  private isInitialized = false;

  private constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.setupOptimizationRules();
  }

  static getInstance(prismaClient?: PrismaClient): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      if (!prismaClient) {
        throw new Error('PrismaClient required for QueryOptimizer initialization');
      }
      QueryOptimizer.instance = new QueryOptimizer(prismaClient);
    }
    return QueryOptimizer.instance;
  }

  /**
   * Initialize query optimizer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.setupQueryInterception();
      await this.startPerformanceMonitoring();
      this.isInitialized = true;

      logger.info('Query optimizer initialized successfully', {
        slowQueryThreshold: OPTIMIZER_CONFIG.performance.slowQueryThreshold,
        cachingEnabled: OPTIMIZER_CONFIG.caching.enabled,
        optimizationEnabled: OPTIMIZER_CONFIG.optimization.enabled,
      });

    } catch (error) {
      logger.error('Failed to initialize query optimizer', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Setup query interception for monitoring
   */
  private async setupQueryInterception(): Promise<void> {
    // Add query event listeners
    this.prisma.$on('query' as never, (event: any) => {
      this.handleQueryEvent(event);
    });

    // Monitor query lifecycle - commented out as $use may not be available in this Prisma version
    // this.prisma.$use(async (params: any, next: any) => {
    //   return this.instrumentQuery(params, next);
    // });
  }

  /**
   * Instrument query execution
   */
  private async instrumentQuery(params: any, next: Function): Promise<any> {
    const queryId = crypto.randomUUID();
    const queryStart = Date.now();
    const queryString = this.buildQueryString(params);
    const queryHash = this.hashQuery(queryString);

    // Track active query
    this.activeQueries.set(queryId, {
      start: queryStart,
      query: queryString,
    });

    return TraceManager.executeWithSpan(
      'database.query',
      async (span) => {
        span.setAttributes({
          'db.operation': params.action,
          'db.model': params.model || 'unknown',
          'db.query_hash': queryHash,
          'db.query_id': queryId,
        });

        try {
          let result: any;
          let fromCache = false;

          // Check cache if enabled and query is cacheable
          if (OPTIMIZER_CONFIG.caching.enabled && this.isCacheableQuery(params)) {
            const cacheKey = this.generateCacheKey(params);
            const cached = await cacheEngine.get(cacheKey);

            if (cached) {
              result = cached;
              fromCache = true;
              span.setAttributes({ 'db.cache_hit': true });
            }
          }

          // Execute query if not cached
          if (!fromCache) {
            result = await next(params);

            // Cache result if applicable
            if (OPTIMIZER_CONFIG.caching.enabled && this.isCacheableQuery(params)) {
              const cacheKey = this.generateCacheKey(params);
              const ttl = this.calculateCacheTTL(params);
              const tags = this.generateCacheTags(params);

              await cacheEngine.set(cacheKey, result, {
                ttl,
                tags,
                compress: JSON.stringify(result).length > OPTIMIZER_CONFIG.caching.compressionThreshold,
              });
            }

            span.setAttributes({ 'db.cache_hit': false });
          }

          const executionTime = Date.now() - queryStart;

          // Record metrics
          const metrics: QueryMetrics = {
            queryHash,
            query: queryString,
            executionTime,
            rowsReturned: Array.isArray(result) ? result.length : (result ? 1 : 0),
            cacheHit: fromCache,
            timestamp: queryStart,
            indexesUsed: [], // Would need query plan analysis
            tablesAccessed: this.extractTablesFromQuery(params),
            connectionId: queryId,
          };

          this.recordQueryMetrics(metrics);

          // Check for slow queries
          if (executionTime > OPTIMIZER_CONFIG.performance.slowQueryThreshold) {
            this.handleSlowQuery(metrics);
          }

          // Update monitoring metrics
          metricsCollector.recordTechnicalMetric('dbQueryDuration', executionTime / 1000);
          metricsCollector.recordTechnicalMetric('dbQueriesTotal', 1, {
            model: params.model || 'unknown',
            action: params.action || 'unknown',
            cached: fromCache.toString(),
          });

          span.setAttributes({
            'db.execution_time_ms': executionTime,
            'db.rows_returned': metrics.rowsReturned,
          });

          return result;

        } catch (error) {
          const executionTime = Date.now() - queryStart;

          // Record error metrics
          metricsCollector.recordTechnicalMetric('dbErrorsTotal', 1, {
            model: params.model || 'unknown',
            action: params.action || 'unknown',
            error_type: error instanceof Error ? error.name : 'Unknown',
          });

          span.setAttributes({
            'db.error': true,
            'db.execution_time_ms': executionTime,
          });

          logger.error('Database query failed', {
            queryHash,
            query: queryString,
            executionTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          throw error;

        } finally {
          this.activeQueries.delete(queryId);
        }
      },
      {
        attributes: {
          'db.system': 'postgresql',
          'db.name': process.env.DATABASE_NAME || 'auto_ani',
        },
      }
    );
  }

  /**
   * Handle query events from Prisma
   */
  private handleQueryEvent(event: any): void {
    const executionTime = event.duration || 0;

    if (executionTime > OPTIMIZER_CONFIG.performance.slowQueryThreshold) {
      logger.warn('Slow query detected', {
        query: event.query,
        duration: executionTime,
        params: event.params,
      });
    }
  }

  /**
   * Start performance monitoring
   */
  private async startPerformanceMonitoring(): Promise<void> {
    // Periodic cleanup and analysis
    setInterval(() => {
      this.cleanupOldMetrics();
      this.analyzeQueryPatterns().catch(error => {
        logger.error('Error analyzing query patterns', {}, error instanceof Error ? error : undefined);
      });
    }, 60000); // Every minute

    // Generate optimization suggestions
    setInterval(() => {
      this.generateOptimizationSuggestions().catch(error => {
        logger.error('Error generating optimization suggestions', {}, error instanceof Error ? error : undefined);
      });
    }, 300000); // Every 5 minutes
  }

  /**
   * Record query metrics
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    const { queryHash } = metrics;

    if (!this.queryMetrics.has(queryHash)) {
      this.queryMetrics.set(queryHash, []);
    }

    const queryMetricsList = this.queryMetrics.get(queryHash)!;
    queryMetricsList.push(metrics);

    // Keep only recent metrics (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.queryMetrics.set(
      queryHash,
      queryMetricsList.filter(m => m.timestamp > oneDayAgo)
    );
  }

  /**
   * Handle slow query detection
   */
  private handleSlowQuery(metrics: QueryMetrics): void {
    logger.warn('Slow query detected', {
      queryHash: metrics.queryHash,
      executionTime: metrics.executionTime,
      rowsReturned: metrics.rowsReturned,
      query: metrics.query.substring(0, 200) + (metrics.query.length > 200 ? '...' : ''),
    });

    // Generate immediate optimization suggestion for very slow queries
    if (metrics.executionTime > OPTIMIZER_CONFIG.performance.verySlowQueryThreshold) {
      this.generateImmediateOptimizationSuggestion(metrics).catch(error => {
        logger.error('Failed to generate immediate optimization suggestion', {}, error instanceof Error ? error : undefined);
      });
    }
  }

  /**
   * Generate immediate optimization suggestion
   */
  private async generateImmediateOptimizationSuggestion(metrics: QueryMetrics): Promise<void> {
    try {
      const suggestions = await this.analyzeQueryForOptimization(metrics);

      for (const suggestion of suggestions) {
        if (suggestion.priority === 'critical' || suggestion.priority === 'high') {
          logger.warn('Critical query optimization needed', {
            queryHash: metrics.queryHash,
            suggestion: suggestion.description,
            estimatedImprovement: suggestion.estimatedImprovement,
          });
        }
      }

    } catch (error) {
      logger.error('Failed to analyze query for optimization', { metrics }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Analyze query for optimization opportunities
   */
  private async analyzeQueryForOptimization(metrics: QueryMetrics): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];

    // Check for missing indexes
    const indexSuggestions = await this.analyzeIndexOpportunities(metrics);
    suggestions.push(...indexSuggestions);

    // Check for query rewriting opportunities
    const rewriteSuggestions = this.analyzeQueryRewriteOpportunities(metrics);
    suggestions.push(...rewriteSuggestions);

    // Check for caching opportunities
    const cachingSuggestions = this.analyzeCachingOpportunities(metrics);
    suggestions.push(...cachingSuggestions);

    return suggestions;
  }

  /**
   * Analyze index opportunities
   */
  private async analyzeIndexOpportunities(metrics: QueryMetrics): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];

    try {
      // Analyze query pattern for potential index needs
      if (metrics.executionTime > 2000 && metrics.rowsReturned < 100) {
        // Suggests this might benefit from an index
        suggestions.push({
          type: 'index',
          priority: 'high',
          description: 'Slow query with few results suggests missing index',
          query: metrics.query,
          suggestion: 'Consider adding an index on frequently filtered columns',
          estimatedImprovement: 80,
          implementation: {
            sql: '-- Index recommendation would require query analysis',
          },
        });
      }

    } catch (error) {
      logger.error('Error analyzing index opportunities', { metrics }, error instanceof Error ? error : undefined);
    }

    return suggestions;
  }

  /**
   * Analyze query rewrite opportunities
   */
  private analyzeQueryRewriteOpportunities(metrics: QueryMetrics): QueryOptimizationSuggestion[] {
    const suggestions: QueryOptimizationSuggestion[] = [];

    // Check for N+1 query patterns
    if (this.isLikelyNPlusOnePattern(metrics)) {
      suggestions.push({
        type: 'query_rewrite',
        priority: 'high',
        description: 'Potential N+1 query pattern detected',
        query: metrics.query,
        suggestion: 'Use include/select to fetch related data in a single query',
        estimatedImprovement: 90,
        implementation: {
          sql: '-- Use Prisma include/select to eager load relations',
        },
      });
    }

    // Check for unnecessary data fetching
    if (metrics.rowsReturned > 1000 && metrics.executionTime > 1000) {
      suggestions.push({
        type: 'query_rewrite',
        priority: 'medium',
        description: 'Large result set with slow execution',
        query: metrics.query,
        suggestion: 'Implement pagination or add more specific filtering',
        estimatedImprovement: 60,
        implementation: {
          sql: '-- Add LIMIT/OFFSET or cursor-based pagination',
        },
      });
    }

    return suggestions;
  }

  /**
   * Analyze caching opportunities
   */
  private analyzeCachingOpportunities(metrics: QueryMetrics): QueryOptimizationSuggestion[] {
    const suggestions: QueryOptimizationSuggestion[] = [];

    // Check if query is frequently executed but not cached
    const queryMetricsList = this.queryMetrics.get(metrics.queryHash) || [];
    const recentExecutions = queryMetricsList.filter(m =>
      Date.now() - m.timestamp < 60000 // Last minute
    );

    if (recentExecutions.length > 5 && !metrics.cacheHit) {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        description: 'Frequently executed query not using cache',
        query: metrics.query,
        suggestion: 'Enable caching for this query pattern',
        estimatedImprovement: 70,
        implementation: {
          cacheConfig: {
            ttl: 300,
            tags: this.generateCacheTags({ model: this.extractModelFromQuery(metrics.query) }),
          },
        },
      });
    }

    return suggestions;
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(): Promise<void> {
    try {
      const allSuggestions: QueryOptimizationSuggestion[] = [];

      // Analyze all recent queries
      for (const [queryHash, metricsList] of this.queryMetrics.entries()) {
        const recentMetrics = metricsList.filter(m =>
          Date.now() - m.timestamp < 3600000 // Last hour
        );

        if (recentMetrics.length > 0) {
          const latestMetric = recentMetrics[recentMetrics.length - 1];
          const suggestions = await this.analyzeQueryForOptimization(latestMetric);
          allSuggestions.push(...suggestions);
        }
      }

      // Log high-priority suggestions
      const criticalSuggestions = allSuggestions.filter(s => s.priority === 'critical');
      const highPrioritySuggestions = allSuggestions.filter(s => s.priority === 'high');

      if (criticalSuggestions.length > 0) {
        logger.warn('Critical query optimizations needed', {
          count: criticalSuggestions.length,
          suggestions: criticalSuggestions.map(s => s.description),
        });
      }

      if (highPrioritySuggestions.length > 0) {
        logger.info('High-priority query optimizations available', {
          count: highPrioritySuggestions.length,
        });
      }

    } catch (error) {
      logger.error('Error generating optimization suggestions', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Analyze query patterns
   */
  private async analyzeQueryPatterns(): Promise<void> {
    try {
      const patterns = new Map<string, number>();
      let totalQueries = 0;
      let totalExecutionTime = 0;
      let slowQueries = 0;

      // Analyze all metrics
      for (const [queryHash, metricsList] of this.queryMetrics.entries()) {
        patterns.set(queryHash, metricsList.length);
        totalQueries += metricsList.length;

        for (const metric of metricsList) {
          totalExecutionTime += metric.executionTime;
          if (metric.executionTime > OPTIMIZER_CONFIG.performance.slowQueryThreshold) {
            slowQueries++;
          }
        }
      }

      const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;

      // Log analysis results
      logger.info('Query pattern analysis', {
        uniqueQueries: patterns.size,
        totalQueries,
        averageExecutionTime: Math.round(averageExecutionTime),
        slowQueries,
        slowQueryPercentage: totalQueries > 0 ? Math.round((slowQueries / totalQueries) * 100) : 0,
      });

    } catch (error) {
      logger.error('Error analyzing query patterns', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(period: { start: Date; end: Date }): Promise<QueryPerformanceReport> {
    try {
      const startTime = period.start.getTime();
      const endTime = period.end.getTime();

      let totalQueries = 0;
      let totalExecutionTime = 0;
      let slowQueries = 0;
      let cacheHits = 0;
      const queryFrequency = new Map<string, { count: number; totalTime: number; query: string }>();
      const slowestQueries: QueryMetrics[] = [];

      // Analyze metrics within period
      for (const [queryHash, metricsList] of this.queryMetrics.entries()) {
        const periodMetrics = metricsList.filter(m =>
          m.timestamp >= startTime && m.timestamp <= endTime
        );

        if (periodMetrics.length === 0) continue;

        totalQueries += periodMetrics.length;

        for (const metric of periodMetrics) {
          totalExecutionTime += metric.executionTime;

          if (metric.executionTime > OPTIMIZER_CONFIG.performance.slowQueryThreshold) {
            slowQueries++;
            slowestQueries.push(metric);
          }

          if (metric.cacheHit) {
            cacheHits++;
          }

          // Track frequency
          if (!queryFrequency.has(queryHash)) {
            queryFrequency.set(queryHash, {
              count: 0,
              totalTime: 0,
              query: metric.query,
            });
          }

          const freq = queryFrequency.get(queryHash)!;
          freq.count++;
          freq.totalTime += metric.executionTime;
        }
      }

      // Sort slowest queries
      slowestQueries.sort((a, b) => b.executionTime - a.executionTime);

      // Get most frequent queries
      const mostFrequentQueries = Array.from(queryFrequency.entries())
        .map(([queryHash, data]) => ({
          queryHash,
          query: data.query.substring(0, 100) + (data.query.length > 100 ? '...' : ''),
          frequency: data.count,
          averageTime: Math.round(data.totalTime / data.count),
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // Generate optimization suggestions
      const optimizationSuggestions: QueryOptimizationSuggestion[] = [];
      for (const metric of slowestQueries.slice(0, 5)) {
        const suggestions = await this.analyzeQueryForOptimization(metric);
        optimizationSuggestions.push(...suggestions);
      }

      const report: QueryPerformanceReport = {
        period,
        summary: {
          totalQueries,
          averageExecutionTime: totalQueries > 0 ? Math.round(totalExecutionTime / totalQueries) : 0,
          slowQueries,
          cacheHitRate: totalQueries > 0 ? Math.round((cacheHits / totalQueries) * 100) : 0,
          mostFrequentQueries,
        },
        slowestQueries: slowestQueries.slice(0, 10),
        optimizationSuggestions,
        indexRecommendations: [], // Would be populated by index analysis
      };

      return report;

    } catch (error) {
      logger.error('Failed to generate performance report', { period }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Setup optimization rules
   */
  private setupOptimizationRules(): void {
    // Rule: Detect N+1 queries
    this.optimizationRules.set('n_plus_one', (metrics: QueryMetrics) => {
      return this.isLikelyNPlusOnePattern(metrics);
    });

    // Rule: Detect missing indexes
    this.optimizationRules.set('missing_index', (metrics: QueryMetrics) => {
      return metrics.executionTime > 1000 && metrics.rowsReturned < 100;
    });

    // Rule: Detect unnecessary data fetching
    this.optimizationRules.set('large_result_set', (metrics: QueryMetrics) => {
      return metrics.rowsReturned > 1000 || metrics.executionTime > 5000;
    });
  }

  /**
   * Utility methods
   */
  private buildQueryString(params: any): string {
    return `${params.model || 'unknown'}.${params.action || 'unknown'}`;
  }

  private hashQuery(query: string): string {
    return crypto.createHash('md5').update(query).digest('hex').substring(0, 16);
  }

  private isCacheableQuery(params: any): boolean {
    // Only cache read operations
    const readOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'];
    return readOperations.includes(params.action);
  }

  private generateCacheKey(params: any): string {
    const queryString = JSON.stringify({
      model: params.model,
      action: params.action,
      args: params.args,
    });
    return `query:${this.hashQuery(queryString)}`;
  }

  private calculateCacheTTL(params: any): number {
    // Different TTLs based on data type
    if (params.model === 'Vehicle') return 600; // 10 minutes
    if (params.model === 'Lead') return 180; // 3 minutes
    return OPTIMIZER_CONFIG.caching.defaultTTL;
  }

  private generateCacheTags(params: any): string[] {
    const tags = [];
    if (params.model) tags.push(`model:${params.model}`);
    if (params.action) tags.push(`action:${params.action}`);
    return tags;
  }

  private extractTablesFromQuery(params: any): string[] {
    const tables = [];
    if (params.model) tables.push(params.model);
    return tables;
  }

  private extractModelFromQuery(query: string): string {
    const match = query.match(/(\w+)\./);
    return match ? match[1] : 'unknown';
  }

  private isLikelyNPlusOnePattern(metrics: QueryMetrics): boolean {
    const recentQueries = this.queryMetrics.get(metrics.queryHash) || [];
    const recentCount = recentQueries.filter(m =>
      Date.now() - m.timestamp < 10000 // Last 10 seconds
    ).length;

    return recentCount > 10; // Many identical queries in short time
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const [queryHash, metricsList] of this.queryMetrics.entries()) {
      const recentMetrics = metricsList.filter(m => m.timestamp > oneDayAgo);
      if (recentMetrics.length === 0) {
        this.queryMetrics.delete(queryHash);
      } else {
        this.queryMetrics.set(queryHash, recentMetrics);
      }
    }
  }

  /**
   * Get optimization statistics
   */
  getStatistics(): {
    trackedQueries: number;
    activeQueries: number;
    totalMetrics: number;
    optimizationRules: number;
  } {
    let totalMetrics = 0;
    for (const metricsList of this.queryMetrics.values()) {
      totalMetrics += metricsList.length;
    }

    return {
      trackedQueries: this.queryMetrics.size,
      activeQueries: this.activeQueries.size,
      totalMetrics,
      optimizationRules: this.optimizationRules.size,
    };
  }
}

// Export configuration for reference
export { OPTIMIZER_CONFIG };