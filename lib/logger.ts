// Centralized logging utility for AUTO ANI Website
// Supports different log levels and integrates with error tracking services

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  requestId?: string;
  ip?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return levels[level] <= levels[this.logLevel];
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const context = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
      const error = entry.error ? ` | Error: ${entry.error.message}` : '';
      return `[${timestamp}] ${level} | ${entry.message}${context}${error}`;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private writeLog(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);

    if (this.isDevelopment) {
      // Console output with colors in development
      switch (entry.level) {
        case 'error':
          console.error(formattedLog);
          break;
        case 'warn':
          console.warn(formattedLog);
          break;
        case 'info':
          console.info(formattedLog);
          break;
        case 'debug':
          console.debug(formattedLog);
          break;
      }
    } else {
      // Structured logging for production
      console.log(formattedLog);
    }

    // Send to external logging service in production
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToErrorTracking(entry);
    }
  }

  private async sendToErrorTracking(entry: LogEntry): Promise<void> {
    try {
      // Integration with Sentry or other error tracking service (optional)
      if (process.env.SENTRY_DSN && typeof window === 'undefined') {
        try {
          // Dynamic import with variable to prevent webpack from trying to resolve during build
          const sentryPackage = '@sentry/nextjs';
          const Sentry = await import(/* webpackIgnore: true */ sentryPackage);

          if (entry.error) {
            Sentry.captureException(entry.error, {
              tags: { source: 'auto-ani-logger' },
              extra: entry.context,
              user: entry.userId ? { id: entry.userId } : undefined,
            });
          } else {
            Sentry.captureMessage(entry.message, 'error');
          }
        } catch {
          // Sentry not installed - silently continue without error tracking
          // In production, you can install: npm install @sentry/nextjs
        }
      }
    } catch (error) {
      // Fallback: don't let logging errors break the application
      // Only log to console as last resort
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send error to tracking service:', error);
      }
    }
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog('error')) return;

    this.writeLog({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;

    this.writeLog({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;

    this.writeLog({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;

    this.writeLog({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  // Audit logging for security events
  async audit(message: string, context?: Record<string, unknown>): Promise<void> {
    this.info(`[AUDIT] ${message}`, context);
  }

  // Specialized logging methods
  apiError(message: string, error: Error, requestInfo?: {
    method?: string;
    url?: string;
    userId?: string;
    ip?: string;
    duration?: number;
    vehicleId?: string;
    appointmentId?: string;
    action?: string;
  }): void {
    this.error(`API Error: ${message}`, {
      api: true,
      ...requestInfo,
      stack: error.stack,
    }, error);
  }

  dbError(message: string, error: Error, query?: string): void {
    this.error(`Database Error: ${message}`, {
      database: true,
      query,
      stack: error.stack,
    }, error);
  }

  authError(message: string, context?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  }): void {
    this.warn(`Authentication Error: ${message}`, {
      auth: true,
      ...context,
    });
  }

  securityEvent(message: string, context?: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    attemptedAction?: string;
  }): void {
    this.warn(`Security Event: ${message}`, {
      security: true,
      ...context,
    });
  }

  performanceMetric(metric: string, value: number, context?: Record<string, unknown>): void {
    this.info(`Performance Metric: ${metric}`, {
      performance: true,
      metric,
      value,
      unit: 'ms',
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export utility functions for common use cases
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  logger.info('API Request', {
    api: true,
    method,
    url,
    statusCode,
    duration,
    userId,
  });
};

export const logDatabaseQuery = (
  query: string,
  duration: number,
  error?: Error
) => {
  if (error) {
    logger.dbError('Database query failed', error, query);
  } else {
    logger.debug('Database Query', {
      database: true,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
    });
  }
};

export const logUserAction = (
  action: string,
  userId: string,
  context?: Record<string, unknown>
) => {
  logger.info(`User Action: ${action}`, {
    user: true,
    userId,
    action,
    ...context,
  });
};

export const logSecurityEvent = (
  event: string,
  ip: string,
  userAgent?: string,
  context?: Record<string, unknown>
) => {
  logger.securityEvent(event, {
    ip,
    userAgent,
    ...context,
  });
};

// Error handling wrapper for async functions
export const withErrorLogging = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(
        `Error in ${context || fn.name}`,
        { args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg) },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };
};

// Default export
export default logger;