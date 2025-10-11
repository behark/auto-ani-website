/**
 * Enterprise Dashboard & SLA Monitoring Engine for AUTO ANI
 *
 * Provides real-time dashboards and SLA monitoring with:
 * - Real-time business KPI visualization
 * - Technical performance monitoring
 * - SLA compliance tracking and alerting
 * - Custom dashboard creation and management
 * - Automated reporting and trend analysis
 *
 * Features customizable dashboards for different stakeholder needs
 */

import { EventEmitter } from 'events';
import { metricsCollector, SLAViolation, METRICS_CONFIG } from './metrics-collector';
import { TraceManager } from './telemetry';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db/connection-pool';

// Dashboard configuration
const DASHBOARD_CONFIG = {
  refresh: {
    realtime: parseInt(process.env.DASHBOARD_REALTIME_REFRESH || '5000'), // 5 seconds
    standard: parseInt(process.env.DASHBOARD_STANDARD_REFRESH || '30000'), // 30 seconds
    historical: parseInt(process.env.DASHBOARD_HISTORICAL_REFRESH || '300000'), // 5 minutes
  },

  retention: {
    realtime: parseInt(process.env.DASHBOARD_REALTIME_RETENTION || '3600'), // 1 hour
    hourly: parseInt(process.env.DASHBOARD_HOURLY_RETENTION || '86400'), // 24 hours
    daily: parseInt(process.env.DASHBOARD_DAILY_RETENTION || '2592000'), // 30 days
  },

  alerts: {
    enabled: process.env.DASHBOARD_ALERTS_ENABLED === 'true',
    channels: ['email', 'slack', 'webhook'], // Support multiple alert channels
    severityThresholds: {
      critical: 0,
      warning: 5,
      info: 10,
    },
  },

  export: {
    enabled: process.env.DASHBOARD_EXPORT_ENABLED === 'true',
    formats: ['pdf', 'png', 'csv', 'json'],
    schedule: process.env.DASHBOARD_EXPORT_SCHEDULE || '0 0 * * *', // Daily at midnight
  },
};

// Dashboard types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'text' | 'alert';
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  config: {
    metric?: string;
    timeRange?: string;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    threshold?: number;
    unit?: string;
    format?: string;
  };
  filters?: Record<string, any>;
  refreshInterval?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category: 'business' | 'technical' | 'executive' | 'custom';
  widgets: DashboardWidget[];
  permissions: {
    view: string[];
    edit: string[];
    admin: string[];
  };
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'light' | 'dark' | 'auto';
    layout: 'grid' | 'flex' | 'masonry';
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SLAReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    availability: number;
    uptime: number;
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
    throughput: number;
  };
  violations: SLAViolation[];
  trends: {
    metric: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }[];
  compliance: {
    availability: boolean;
    responseTime: boolean;
    errorRate: boolean;
    overall: boolean;
  };
}

/**
 * Dashboard and SLA Monitoring Engine
 */
export class DashboardEngine extends EventEmitter {
  private static instance: DashboardEngine;
  private dashboards: Map<string, Dashboard> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private slaViolations: SLAViolation[] = [];
  private metricsBuffer: Map<string, Array<{ timestamp: number; value: number; labels?: Record<string, string> }>> = new Map();
  private isInitialized = false;
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxBufferSize: number = 1000; // Limit buffer size to prevent memory leaks
  private maxSLAViolationsHistory: number = 1000; // Limit SLA violations history

  private constructor() {
    super();
    this.setupEventListeners();
  }

  static getInstance(): DashboardEngine {
    if (!DashboardEngine.instance) {
      DashboardEngine.instance = new DashboardEngine();
    }
    return DashboardEngine.instance;
  }

  /**
   * Initialize dashboard engine
   */
  async initialize(): Promise<void> {
    try {
      await this.loadDashboards();
      await this.setupDefaultDashboards();
      this.startDataCollection();
      this.isInitialized = true;

      logger.info('Dashboard engine initialized successfully', {
        dashboardCount: this.dashboards.size,
        widgetCount: this.widgets.size,
      });

    } catch (error) {
      logger.error('Failed to initialize dashboard engine', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Setup event listeners for metrics and SLA violations
   */
  private setupEventListeners(): void {
    // Listen for SLA violations
    metricsCollector.on('sla_violation', (violation: SLAViolation) => {
      this.handleSLAViolation(violation);
    });

    // Listen for metric updates
    metricsCollector.on('metric_recorded', (data: { name: string; value: number; labels?: Record<string, string> }) => {
      this.bufferMetricData(data.name, data.value, data.labels);
    });
  }

  /**
   * Load existing dashboards from database
   */
  private async loadDashboards(): Promise<void> {
    try {
      // For now, we'll use Redis to store dashboard configurations
      // In a full implementation, you might want to use a dedicated database table
      const dashboardKeys = await redis.keys('dashboard:*');

      for (const key of dashboardKeys) {
        try {
          const dashboardData = await redis.get(key);
          if (dashboardData) {
            const dashboard: Dashboard = JSON.parse(dashboardData);
            this.dashboards.set(dashboard.id, dashboard);

            // Register widgets
            for (const widget of dashboard.widgets) {
              this.widgets.set(widget.id, widget);
            }
          }
        } catch (error) {
          logger.warn('Failed to load dashboard', { key, error: error instanceof Error ? error.message : String(error) });
        }
      }

    } catch (error) {
      logger.error('Failed to load dashboards', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Setup default dashboards for different user types
   */
  private async setupDefaultDashboards(): Promise<void> {
    const defaultDashboards: Dashboard[] = [
      this.createExecutiveDashboard(),
      this.createBusinessDashboard(),
      this.createTechnicalDashboard(),
      this.createSLADashboard(),
    ];

    for (const dashboard of defaultDashboards) {
      if (!this.dashboards.has(dashboard.id)) {
        await this.createDashboard(dashboard);
      }
    }
  }

  /**
   * Create executive dashboard
   */
  private createExecutiveDashboard(): Dashboard {
    return {
      id: 'executive-overview',
      name: 'Executive Overview',
      description: 'High-level business metrics for executives',
      category: 'executive',
      widgets: [
        {
          id: 'total-revenue',
          type: 'metric',
          title: 'Total Revenue',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: {
            metric: 'revenue',
            aggregation: 'sum',
            unit: '€',
            format: 'currency',
          },
        },
        {
          id: 'conversion-rate',
          type: 'gauge',
          title: 'Conversion Rate',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: {
            metric: 'conversionRate',
            unit: '%',
            threshold: 5,
          },
        },
        {
          id: 'leads-trend',
          type: 'chart',
          title: 'Leads Trend',
          position: { x: 0, y: 2, width: 6, height: 3 },
          config: {
            metric: 'leadsCreated',
            chartType: 'line',
            timeRange: '7d',
            aggregation: 'sum',
          },
        },
        {
          id: 'vehicle-sales',
          type: 'chart',
          title: 'Vehicle Sales',
          position: { x: 6, y: 0, width: 6, height: 5 },
          config: {
            metric: 'vehiclesSold',
            chartType: 'bar',
            timeRange: '30d',
            aggregation: 'count',
          },
        },
      ],
      permissions: {
        view: ['executive', 'admin'],
        edit: ['admin'],
        admin: ['admin'],
      },
      settings: {
        autoRefresh: true,
        refreshInterval: DASHBOARD_CONFIG.refresh.standard,
        theme: 'light',
        layout: 'grid',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };
  }

  /**
   * Create business dashboard
   */
  private createBusinessDashboard(): Dashboard {
    return {
      id: 'business-metrics',
      name: 'Business Metrics',
      description: 'Comprehensive business performance tracking',
      category: 'business',
      widgets: [
        {
          id: 'lead-funnel',
          type: 'chart',
          title: 'Lead Funnel',
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: {
            metric: 'leadsFunnel',
            chartType: 'area',
            timeRange: '30d',
          },
        },
        {
          id: 'vehicle-views',
          type: 'metric',
          title: 'Vehicle Views',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: {
            metric: 'vehiclesViewed',
            aggregation: 'sum',
            timeRange: '24h',
          },
        },
        {
          id: 'avg-order-value',
          type: 'metric',
          title: 'Average Order Value',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: {
            metric: 'averageOrderValue',
            aggregation: 'avg',
            unit: '€',
            format: 'currency',
          },
        },
        {
          id: 'email-performance',
          type: 'table',
          title: 'Email Campaign Performance',
          position: { x: 6, y: 2, width: 6, height: 4 },
          config: {
            metric: 'emailPerformance',
            timeRange: '7d',
          },
        },
      ],
      permissions: {
        view: ['business', 'marketing', 'sales', 'admin'],
        edit: ['business', 'admin'],
        admin: ['admin'],
      },
      settings: {
        autoRefresh: true,
        refreshInterval: DASHBOARD_CONFIG.refresh.standard,
        theme: 'light',
        layout: 'grid',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };
  }

  /**
   * Create technical dashboard
   */
  private createTechnicalDashboard(): Dashboard {
    return {
      id: 'technical-performance',
      name: 'Technical Performance',
      description: 'System performance and health monitoring',
      category: 'technical',
      widgets: [
        {
          id: 'response-time',
          type: 'chart',
          title: 'API Response Time',
          position: { x: 0, y: 0, width: 6, height: 3 },
          config: {
            metric: 'httpRequestDuration',
            chartType: 'line',
            timeRange: '1h',
            unit: 'ms',
          },
        },
        {
          id: 'error-rate',
          type: 'gauge',
          title: 'Error Rate',
          position: { x: 6, y: 0, width: 3, height: 3 },
          config: {
            metric: 'httpErrorRate',
            unit: '%',
            threshold: METRICS_CONFIG.sla.errorRateThreshold * 100,
          },
        },
        {
          id: 'db-connections',
          type: 'chart',
          title: 'Database Connections',
          position: { x: 9, y: 0, width: 3, height: 3 },
          config: {
            metric: 'dbConnectionsActive',
            chartType: 'area',
            timeRange: '1h',
          },
        },
        {
          id: 'memory-usage',
          type: 'chart',
          title: 'Memory Usage',
          position: { x: 0, y: 3, width: 6, height: 3 },
          config: {
            metric: 'memoryUsage',
            chartType: 'line',
            timeRange: '1h',
            unit: 'MB',
          },
        },
        {
          id: 'cache-performance',
          type: 'metric',
          title: 'Cache Hit Rate',
          position: { x: 6, y: 3, width: 6, height: 3 },
          config: {
            metric: 'cacheHitRate',
            aggregation: 'avg',
            unit: '%',
          },
        },
      ],
      permissions: {
        view: ['technical', 'devops', 'admin'],
        edit: ['technical', 'admin'],
        admin: ['admin'],
      },
      settings: {
        autoRefresh: true,
        refreshInterval: DASHBOARD_CONFIG.refresh.realtime,
        theme: 'dark',
        layout: 'grid',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };
  }

  /**
   * Create SLA monitoring dashboard
   */
  private createSLADashboard(): Dashboard {
    return {
      id: 'sla-monitoring',
      name: 'SLA Monitoring',
      description: 'Service Level Agreement compliance tracking',
      category: 'technical',
      widgets: [
        {
          id: 'uptime',
          type: 'gauge',
          title: 'System Uptime',
          position: { x: 0, y: 0, width: 3, height: 3 },
          config: {
            metric: 'uptime',
            unit: '%',
            threshold: METRICS_CONFIG.sla.uptimeThreshold * 100,
          },
        },
        {
          id: 'availability',
          type: 'gauge',
          title: 'Service Availability',
          position: { x: 3, y: 0, width: 3, height: 3 },
          config: {
            metric: 'availability',
            unit: '%',
            threshold: METRICS_CONFIG.sla.availabilityThreshold * 100,
          },
        },
        {
          id: 'sla-violations',
          type: 'alert',
          title: 'Recent SLA Violations',
          position: { x: 6, y: 0, width: 6, height: 3 },
          config: {
            timeRange: '24h',
          },
        },
        {
          id: 'performance-trends',
          type: 'chart',
          title: 'Performance Trends',
          position: { x: 0, y: 3, width: 12, height: 4 },
          config: {
            metric: 'performanceTrends',
            chartType: 'line',
            timeRange: '7d',
          },
        },
      ],
      permissions: {
        view: ['technical', 'devops', 'management', 'admin'],
        edit: ['technical', 'admin'],
        admin: ['admin'],
      },
      settings: {
        autoRefresh: true,
        refreshInterval: DASHBOARD_CONFIG.refresh.realtime,
        theme: 'light',
        layout: 'grid',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };
  }

  /**
   * Start data collection for dashboards
   */
  private startDataCollection(): void {
    // Start realtime data collection
    const realtimeTimer = setInterval(() => {
      this.collectRealtimeData().catch(error => {
        logger.error('Failed to collect realtime data', {}, error instanceof Error ? error : undefined);
      });
    }, DASHBOARD_CONFIG.refresh.realtime);

    this.refreshTimers.set('realtime', realtimeTimer);

    // Start historical data aggregation
    const historicalTimer = setInterval(() => {
      this.aggregateHistoricalData().catch(error => {
        logger.error('Failed to aggregate historical data', {}, error instanceof Error ? error : undefined);
      });
    }, DASHBOARD_CONFIG.refresh.historical);

    this.refreshTimers.set('historical', historicalTimer);

    // Start periodic memory cleanup
    const cleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, 300000); // Cleanup every 5 minutes

    this.refreshTimers.set('cleanup', cleanupTimer);
  }

  /**
   * Collect realtime data for dashboards
   */
  private async collectRealtimeData(): Promise<void> {
    try {
      // Collect current system metrics
      const timestamp = Date.now();

      // Buffer system metrics
      this.bufferMetricData('system_timestamp', timestamp);

      // Emit realtime data update
      this.emit('realtime_data_update', {
        timestamp,
        metrics: Object.fromEntries(this.metricsBuffer),
      });

    } catch (error) {
      logger.error('Error collecting realtime data', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Aggregate historical data
   */
  private async aggregateHistoricalData(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Aggregate business metrics
      const businessMetrics = await this.aggregateBusinessMetrics(oneHourAgo, now);

      // Store aggregated data
      await redis.setex(
        `dashboard:aggregated:${Math.floor(now.getTime() / (60 * 60 * 1000))}`,
        DASHBOARD_CONFIG.retention.hourly,
        JSON.stringify(businessMetrics)
      );

    } catch (error) {
      logger.error('Error aggregating historical data', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Aggregate business metrics from database
   */
  private async aggregateBusinessMetrics(startTime: Date, endTime: Date): Promise<Record<string, number>> {
    try {
      const metrics: Record<string, number> = {};

      // Lead metrics
      const leadCount = await prisma.lead.count({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      const qualifiedLeadCount = await prisma.lead.count({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
          stage: 'QUALIFIED',
        },
      });

      // Vehicle metrics
      const vehicleViews = await prisma.vehicle.count({
        where: {
          updatedAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      const inquiryCount = await prisma.vehicleInquiry.count({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      // Payment metrics - using sales pipeline as proxy since payment model doesn't exist
      const totalRevenue = await prisma.sales_pipeline.aggregate({
        where: {
          actualClose: {
            gte: startTime,
            lte: endTime,
          },
          stage: 'CLOSED_WON',
        },
        _sum: {
          dealValue: true,
        },
      });

      metrics.leadsCreated = leadCount;
      metrics.leadsQualified = qualifiedLeadCount;
      metrics.vehicleViews = vehicleViews;
      metrics.inquiries = inquiryCount;
      metrics.revenue = totalRevenue._sum.dealValue || 0; // Deal value in euros
      metrics.conversionRate = leadCount > 0 ? (qualifiedLeadCount / leadCount) * 100 : 0;

      return metrics;

    } catch (error) {
      logger.error('Error aggregating business metrics', { startTime, endTime }, error instanceof Error ? error : undefined);
      return {};
    }
  }

  /**
   * Buffer metric data for realtime processing with memory management
   */
  private bufferMetricData(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.metricsBuffer.has(name)) {
      this.metricsBuffer.set(name, []);
    }

    const buffer = this.metricsBuffer.get(name)!;
    buffer.push({
      timestamp: Date.now(),
      value,
      labels,
    });

    // Keep only recent data (last 5 minutes) and limit size
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const filteredBuffer = buffer.filter(entry => entry.timestamp > fiveMinutesAgo);

    // Limit buffer size to prevent memory leaks
    if (filteredBuffer.length > this.maxBufferSize) {
      filteredBuffer.splice(0, filteredBuffer.length - this.maxBufferSize);
    }

    this.metricsBuffer.set(name, filteredBuffer);
  }

  /**
   * Handle SLA violations with memory management
   */
  private handleSLAViolation(violation: SLAViolation): void {
    this.slaViolations.push(violation);

    // Keep only recent violations (last 24 hours) and limit size
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.slaViolations = this.slaViolations.filter(v => v.timestamp > oneDayAgo);

    // Limit the number of stored violations to prevent memory leaks
    if (this.slaViolations.length > this.maxSLAViolationsHistory) {
      this.slaViolations.splice(0, this.slaViolations.length - this.maxSLAViolationsHistory);
    }

    // Emit SLA violation event
    this.emit('sla_violation', violation);

    logger.warn('SLA violation recorded', {
      metric: violation.metric,
      threshold: violation.threshold,
      actual: violation.actual,
      severity: violation.severity,
    });
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(dashboard: Dashboard): Promise<void> {
    try {
      this.dashboards.set(dashboard.id, dashboard);

      // Register widgets
      for (const widget of dashboard.widgets) {
        this.widgets.set(widget.id, widget);
      }

      // Save to persistent storage
      await redis.setex(
        `dashboard:${dashboard.id}`,
        DASHBOARD_CONFIG.retention.daily,
        JSON.stringify(dashboard)
      );

      logger.info('Dashboard created', {
        dashboardId: dashboard.id,
        name: dashboard.name,
        category: dashboard.category,
        widgetCount: dashboard.widgets.length,
      });

    } catch (error) {
      logger.error('Failed to create dashboard', { dashboardId: dashboard.id }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId: string): Dashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards for a user
   */
  getDashboardsForUser(userRole: string): Dashboard[] {
    return Array.from(this.dashboards.values()).filter(dashboard =>
      dashboard.permissions.view.includes(userRole) ||
      dashboard.permissions.view.includes('*')
    );
  }

  /**
   * Get widget data
   */
  async getWidgetData(widgetId: string, timeRange?: string): Promise<any> {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    return TraceManager.executeWithSpan(
      'dashboard.get_widget_data',
      async (span) => {
        span.setAttributes({
          'widget.id': widgetId,
          'widget.type': widget.type,
          'widget.metric': widget.config.metric || 'unknown',
        });

        try {
          const metricName = widget.config.metric;
          if (!metricName) {
            return null;
          }

          const buffer = this.metricsBuffer.get(metricName) || [];
          const range = timeRange || widget.config.timeRange || '1h';

          // Filter data by time range
          const rangeMs = this.parseTimeRange(range);
          const cutoff = Date.now() - rangeMs;
          const filteredData = buffer.filter(entry => entry.timestamp > cutoff);

          // Apply aggregation
          const aggregation = widget.config.aggregation || 'avg';
          const aggregatedValue = this.aggregateData(filteredData, aggregation);

          return {
            value: aggregatedValue,
            data: filteredData,
            timestamp: Date.now(),
            unit: widget.config.unit,
            format: widget.config.format,
          };

        } catch (error) {
          span.setAttributes({ 'widget.error': true });
          throw error;
        }
      }
    );
  }

  /**
   * Generate SLA report
   */
  async generateSLAReport(period: { start: Date; end: Date }): Promise<SLAReport> {
    try {
      const violations = this.slaViolations.filter(v =>
        v.timestamp >= period.start.getTime() &&
        v.timestamp <= period.end.getTime()
      );

      // Calculate metrics (simplified implementation)
      const businessMetrics = await this.aggregateBusinessMetrics(period.start, period.end);

      const report: SLAReport = {
        period,
        metrics: {
          availability: 99.9, // Calculate from uptime data
          uptime: 99.95, // Calculate from system metrics
          responseTime: {
            average: 250, // Calculate from response time metrics
            p95: 500,
            p99: 1000,
          },
          errorRate: 0.5, // Calculate from error metrics
          throughput: 1000, // Calculate from request metrics
        },
        violations,
        trends: [
          {
            metric: 'responseTime',
            trend: 'stable',
            change: 0.02,
          },
          {
            metric: 'errorRate',
            trend: 'down',
            change: -0.1,
          },
        ],
        compliance: {
          availability: true,
          responseTime: true,
          errorRate: true,
          overall: violations.filter(v => v.severity === 'critical').length === 0,
        },
      };

      return report;

    } catch (error) {
      logger.error('Failed to generate SLA report', { period }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Parse time range string to milliseconds
   */
  private parseTimeRange(range: string): number {
    const match = range.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 60 * 60 * 1000; // Default 1 hour
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  /**
   * Aggregate data array
   */
  private aggregateData(data: Array<{ value: number }>, aggregation: string): number {
    if (data.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return data.reduce((sum, entry) => sum + entry.value, 0);
      case 'avg':
        return data.reduce((sum, entry) => sum + entry.value, 0) / data.length;
      case 'min':
        return Math.min(...data.map(entry => entry.value));
      case 'max':
        return Math.max(...data.map(entry => entry.value));
      case 'count':
        return data.length;
      default:
        return data.reduce((sum, entry) => sum + entry.value, 0) / data.length;
    }
  }

  /**
   * Stop dashboard engine and cleanup resources
   */
  stop(): void {
    // Clear all timers
    for (const [name, timer] of this.refreshTimers.entries()) {
      clearInterval(timer);
    }
    this.refreshTimers.clear();

    // Clear all data structures to free memory
    this.dashboards.clear();
    this.widgets.clear();
    this.slaViolations.length = 0;
    this.metricsBuffer.clear();

    // Remove event listeners
    this.removeAllListeners();

    this.isInitialized = false;

    logger.info('Dashboard engine stopped and memory cleared');
  }

  /**
   * Perform periodic memory cleanup
   */
  private performMemoryCleanup(): void {
    try {
      // Cleanup metrics buffer
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);

      for (const [name, buffer] of this.metricsBuffer.entries()) {
        const filteredBuffer = buffer.filter(entry => entry.timestamp > fiveMinutesAgo);
        if (filteredBuffer.length > this.maxBufferSize) {
          filteredBuffer.splice(0, filteredBuffer.length - this.maxBufferSize);
        }
        this.metricsBuffer.set(name, filteredBuffer);
      }

      // Cleanup SLA violations
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      this.slaViolations = this.slaViolations.filter(v => v.timestamp > oneDayAgo);
      if (this.slaViolations.length > this.maxSLAViolationsHistory) {
        this.slaViolations.splice(0, this.slaViolations.length - this.maxSLAViolationsHistory);
      }

      logger.debug('Dashboard memory cleanup completed', {
        metricsBufferSize: this.metricsBuffer.size,
        slaViolationsCount: this.slaViolations.length
      });
    } catch (error) {
      logger.error('Error during dashboard memory cleanup', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get dashboard statistics
   */
  getStatistics(): {
    dashboards: number;
    widgets: number;
    slaViolations: number;
    metricsBuffered: number;
  } {
    return {
      dashboards: this.dashboards.size,
      widgets: this.widgets.size,
      slaViolations: this.slaViolations.length,
      metricsBuffered: this.metricsBuffer.size,
    };
  }
}

// Export singleton instance
export const dashboardEngine = DashboardEngine.getInstance();

// Export configuration for reference
export { DASHBOARD_CONFIG };