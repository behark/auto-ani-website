/**
 * Enterprise System Bootstrap for AUTO ANI
 *
 * Initializes all enterprise-grade systems:
 * - OpenTelemetry distributed tracing
 * - Metrics collection and monitoring
 * - Multi-level caching engine
 * - Query optimization
 * - Error handling and resilience
 * - Security engine
 * - Dashboard and SLA monitoring
 *
 * Call this during application startup for full enterprise functionality
 */

import { prisma } from './db/connection-pool';
import { logger } from './logger';
import { cacheEngine } from './performance/cache-engine';
import { QueryOptimizer } from './performance/query-optimizer';
import { errorHandler } from './resilience/error-handler';
import { securityEngine } from './security/security-engine';

// Bootstrap configuration
// CRITICAL FIX FOR RENDER FREE TIER (512MB RAM):
// Disable heavy monitoring systems that cause memory issues and crashes
const isProduction = process.env.NODE_ENV === 'production';
const isFreeTier = !process.env.ENTERPRISE_MODE; // Only enable if explicitly set

const BOOTSTRAP_CONFIG = {
  telemetry: {
    // Telemetry disabled on free tier - causes memory overhead
    enabled: isFreeTier ? false : (process.env.TELEMETRY_ENABLED !== 'false'),
    skipInDevelopment: process.env.TELEMETRY_SKIP_DEV === 'true',
  },

  metrics: {
    // Metrics collection disabled on free tier - heavy memory usage
    enabled: isFreeTier ? false : (process.env.METRICS_ENABLED !== 'false'),
    autoStart: isFreeTier ? false : (process.env.METRICS_AUTO_START !== 'false'),
  },

  caching: {
    // Basic caching OK, but no pre-warming on free tier
    enabled: process.env.CACHING_ENABLED !== 'false',
    preWarm: isFreeTier ? false : (process.env.CACHE_PRE_WARM === 'true'),
  },

  optimization: {
    // Query optimization disabled on free tier - uses memory for tracking
    enabled: isFreeTier ? false : (process.env.QUERY_OPTIMIZATION_ENABLED !== 'false'),
    autoInit: isFreeTier ? false : (process.env.QUERY_OPTIMIZER_AUTO_INIT !== 'false'),
  },

  monitoring: {
    // Dashboards disabled on free tier - heavy background timers
    enabled: isFreeTier ? false : (process.env.MONITORING_ENABLED !== 'false'),
    dashboards: isFreeTier ? false : (process.env.DASHBOARDS_ENABLED !== 'false'),
  },

  security: {
    // Security engine disabled on free tier - uses memory for tracking
    enabled: isFreeTier ? false : (process.env.SECURITY_ENGINE_ENABLED !== 'false'),
    strictMode: process.env.SECURITY_STRICT_MODE === 'true',
  },

  resilience: {
    // Resilience disabled on free tier - circuit breakers use memory
    enabled: isFreeTier ? false : (process.env.RESILIENCE_ENABLED !== 'false'),
    circuitBreakers: isFreeTier ? false : (process.env.CIRCUIT_BREAKERS_ENABLED !== 'false'),
  },
};

/**
 * Enterprise System Bootstrap
 */
export class EnterpriseBootstrap {
  private static instance: EnterpriseBootstrap;
  private initialized = false;
  private systems: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): EnterpriseBootstrap {
    if (!EnterpriseBootstrap.instance) {
      EnterpriseBootstrap.instance = new EnterpriseBootstrap();
    }
    return EnterpriseBootstrap.instance;
  }

  /**
   * Initialize all enterprise systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Enterprise systems already initialized');
      return;
    }

    const startTime = Date.now();
    const mode = isFreeTier ? 'FREE TIER (lightweight)' : 'ENTERPRISE (full features)';
    logger.info(`Initializing enterprise systems in ${mode} mode...`, {
      mode: isFreeTier ? 'free-tier' : 'enterprise',
      config: BOOTSTRAP_CONFIG,
    });

    try {
      // Initialize systems in dependency order
      await this.initializeTelemetrySystem();
      await this.initializeMetricsSystem();
      await this.initializeCachingSystem();
      await this.initializeOptimizationSystem();
      await this.initializeResilienceSystem();
      await this.initializeSecuritySystem();
      await this.initializeMonitoringSystem();

      this.initialized = true;
      const initTime = Date.now() - startTime;

      logger.info('Enterprise systems initialized successfully', {
        initializationTime: `${initTime}ms`,
        systems: Object.fromEntries(this.systems),
      });

      // Start system health monitoring
      this.startHealthMonitoring();

    } catch (error) {
      logger.error('Failed to initialize enterprise systems', {}, error instanceof Error ? error : undefined);
      throw new Error(`Enterprise system initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize OpenTelemetry tracing system
   */
  private async initializeTelemetrySystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.telemetry.enabled) {
        logger.info('Telemetry system disabled via configuration');
        this.systems.set('telemetry', false);
        return;
      }

      if (BOOTSTRAP_CONFIG.telemetry.skipInDevelopment && process.env.NODE_ENV === 'development') {
        logger.info('Skipping telemetry initialization in development');
        this.systems.set('telemetry', false);
        return;
      }

      // Telemetry module removed for memory optimization
      logger.info('Telemetry system disabled (module removed for memory optimization)');
      this.systems.set('telemetry', false);

    } catch (error) {
      logger.error('Failed to initialize telemetry system', {}, error instanceof Error ? error : undefined);
      this.systems.set('telemetry', false);
      // Don't throw - telemetry is not critical for basic functionality
    }
  }

  /**
   * Initialize metrics collection system
   */
  private async initializeMetricsSystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.metrics.enabled) {
        logger.info('Metrics system disabled via configuration');
        this.systems.set('metrics', false);
        return;
      }

      // Metrics collector module removed for memory optimization
      logger.info('Metrics system disabled (module removed for memory optimization)');
      this.systems.set('metrics', false);

    } catch (error) {
      logger.error('Failed to initialize metrics system', {}, error instanceof Error ? error : undefined);
      this.systems.set('metrics', false);
      // Don't throw - metrics are not critical for basic functionality
    }
  }

  /**
   * Initialize caching system
   */
  private async initializeCachingSystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.caching.enabled) {
        this.systems.set('caching', false);
        return;
      }

      // Cache engine is a singleton, no initialization required
      // But we can pre-warm cache if needed
      if (BOOTSTRAP_CONFIG.caching.preWarm) {
        await this.preWarmCache();
      }

      this.systems.set('caching', true);
      logger.info('Caching system initialized');

    } catch (error) {
      logger.error('Failed to initialize caching system', {}, error instanceof Error ? error : undefined);
      this.systems.set('caching', false);
      // Don't throw - application can work without cache
    }
  }

  /**
   * Initialize query optimization system
   */
  private async initializeOptimizationSystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.optimization.enabled) {
        this.systems.set('optimization', false);
        return;
      }

      if (BOOTSTRAP_CONFIG.optimization.autoInit) {
        const queryOptimizer = QueryOptimizer.getInstance(prisma);
        await queryOptimizer.initialize();
      }

      this.systems.set('optimization', true);
      logger.info('Query optimization system initialized');

    } catch (error) {
      logger.error('Failed to initialize query optimization system', {}, error instanceof Error ? error : undefined);
      this.systems.set('optimization', false);
      // Don't throw - application can work without optimization
    }
  }

  /**
   * Initialize resilience and error handling system
   */
  private async initializeResilienceSystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.resilience.enabled) {
        this.systems.set('resilience', false);
        return;
      }

      // Error handler is a singleton, automatically initializes
      // Set up event listeners for critical errors
      errorHandler.on('critical_error_threshold_exceeded', (data) => {
        logger.error('Critical error threshold exceeded', data);
      });

      errorHandler.on('circuit_breaker_state_change', (data) => {
        logger.warn('Circuit breaker state changed', data);
      });

      this.systems.set('resilience', true);
      logger.info('Resilience system initialized');

    } catch (error) {
      logger.error('Failed to initialize resilience system', {}, error instanceof Error ? error : undefined);
      this.systems.set('resilience', false);
      // Don't throw - but this is more critical
    }
  }

  /**
   * Initialize security system
   */
  private async initializeSecuritySystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.security.enabled) {
        this.systems.set('security', false);
        return;
      }

      // Security engine is a singleton, automatically initializes
      // Set up event listeners for security events
      securityEngine.on('security_alert', (event) => {
        logger.warn('Security alert', event);
      });

      securityEngine.on('security_event', (event) => {
        if (event.severity === 'critical' || event.severity === 'high') {
          logger.warn('High severity security event', event);
        }
      });

      this.systems.set('security', true);
      logger.info('Security system initialized');

    } catch (error) {
      logger.error('Failed to initialize security system', {}, error instanceof Error ? error : undefined);
      this.systems.set('security', false);
      // Don't throw - but security is critical
    }
  }

  /**
   * Initialize monitoring and dashboard system
   */
  private async initializeMonitoringSystem(): Promise<void> {
    try {
      if (!BOOTSTRAP_CONFIG.monitoring.enabled) {
        logger.info('Monitoring system disabled via configuration');
        this.systems.set('monitoring', false);
        return;
      }

      // Dashboard engine module removed for memory optimization
      logger.info('Monitoring system disabled (module removed for memory optimization)');
      this.systems.set('monitoring', false);

    } catch (error) {
      logger.error('Failed to initialize monitoring system', {}, error instanceof Error ? error : undefined);
      this.systems.set('monitoring', false);
      // Don't throw - monitoring is not critical for basic functionality
    }
  }

  /**
   * Pre-warm cache with common data
   */
  private async preWarmCache(): Promise<void> {
    try {
      logger.info('Pre-warming cache...');

      // Define cache warming function
      const warmupFunction = async (key: string) => {
        // This would typically load data for the key
        // For now, just simulate
        await new Promise(resolve => setTimeout(resolve, 10));
      };

      // Start cache warming
      await cacheEngine.warmupCache(warmupFunction);

      logger.info('Cache pre-warming completed');

    } catch (error) {
      logger.warn('Cache pre-warming failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Start health monitoring for all systems
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error('Health check failed', {}, error instanceof Error ? error : undefined);
      });
    }, 60000); // Every minute
  }

  /**
   * Perform health check on all systems
   */
  private async performHealthCheck(): Promise<void> {
    const health = {
      telemetry: this.systems.get('telemetry') || false,
      metrics: this.systems.get('metrics') || false,
      caching: this.systems.get('caching') || false,
      optimization: this.systems.get('optimization') || false,
      resilience: this.systems.get('resilience') || false,
      security: this.systems.get('security') || false,
      monitoring: this.systems.get('monitoring') || false,
    };

    const healthyCount = Object.values(health).filter(Boolean).length;
    const totalCount = Object.keys(health).length;

    logger.debug('Enterprise systems health check', {
      healthy: healthyCount,
      total: totalCount,
      percentage: Math.round((healthyCount / totalCount) * 100),
      systems: health,
    });

    // Alert if too many systems are down
    if (healthyCount < totalCount * 0.7) { // Less than 70% healthy
      logger.warn('Enterprise systems health degraded', {
        healthy: healthyCount,
        total: totalCount,
        systems: health,
      });
    }
  }

  /**
   * Graceful shutdown of all systems
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    logger.info('Shutting down enterprise systems...');

    try {
      // Metrics and monitoring systems are disabled (modules removed for memory optimization)
      logger.info('Metrics and monitoring systems already disabled');

      // Additional cleanup can be added here

      this.initialized = false;
      logger.info('Enterprise systems shutdown completed');

    } catch (error) {
      logger.error('Error during enterprise systems shutdown', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    initialized: boolean;
    systems: Record<string, boolean>;
    healthPercentage: number;
  } {
    const systems = Object.fromEntries(this.systems);
    const healthyCount = Object.values(systems).filter(Boolean).length;
    const totalCount = Object.keys(systems).length;

    return {
      initialized: this.initialized,
      systems,
      healthPercentage: totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0,
    };
  }

  /**
   * Enable/disable specific system
   */
  toggleSystem(systemName: string, enabled: boolean): void {
    if (this.systems.has(systemName)) {
      this.systems.set(systemName, enabled);
      logger.info(`System ${systemName} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      logger.warn(`Unknown system: ${systemName}`);
    }
  }
}

// Export singleton instance and convenience functions
export const enterpriseBootstrap = EnterpriseBootstrap.getInstance();

/**
 * Initialize enterprise systems (convenience function)
 */
export async function initializeEnterpriseSystems(): Promise<void> {
  await enterpriseBootstrap.initialize();
}

/**
 * Shutdown enterprise systems (convenience function)
 */
export async function shutdownEnterpriseSystems(): Promise<void> {
  await enterpriseBootstrap.shutdown();
}

/**
 * Get enterprise systems status (convenience function)
 */
export function getEnterpriseSystemsStatus(): ReturnType<typeof enterpriseBootstrap.getSystemStatus> {
  return enterpriseBootstrap.getSystemStatus();
}

// Export configuration for reference
export { BOOTSTRAP_CONFIG };