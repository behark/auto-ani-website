import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Environment configuration
      environment: process.env.NODE_ENV || 'development',

      // Release tracking for version management (commented out due to type constraints)
      // release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || `auto-ani@${process.env.npm_package_version}`,

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session replay for error debugging (commented out due to type constraints)
      // replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // replaysOnErrorSampleRate: 1.0,

      // Enhanced error tracking
      beforeSend(event: any, hint?: any) {
        // Filter out noise and sensitive data
        if (event.exception) {
          const error = hint.originalException as Error;

          // Don't send errors from development
          if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_MODE) {
            return null;
          }

          // Filter out common non-critical errors
          if (error?.message?.includes('ResizeObserver')) {
            return null;
          }

          // Scrub sensitive data from error messages
          if (event.message) {
            event.message = scrubSensitiveData(event.message);
          }

          // Scrub breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => ({
              ...breadcrumb,
              message: breadcrumb.message ? scrubSensitiveData(breadcrumb.message) : undefined,
              data: breadcrumb.data ? scrubSensitiveObject(breadcrumb.data) : undefined,
            }));
          }
        }

        return event;
      },

      // Integration configurations
      integrations: [
        // BrowserTracing integration (commented out due to type issues)
        // new Sentry.BrowserTracing({
        //   tracePropagationTargets: [
        //     'localhost',
        //     /^https:\/\/autosalonani\.com/,
        //     /^https:\/\/.*\.netlify\.app/,
        //   ],
        // }),
        // Replay integration (commented out due to type issues)
        // new Sentry.Replay({
        //   maskAllText: true,
        //   blockAllMedia: true,
        //   networkDetailAllowUrls: [
        //     /^https:\/\/autosalonani\.com/,
        //     /^https:\/\/.*\.netlify\.app/,
        //   ],
        // }),
      ],

      // Ignore specific errors (commented out due to type constraints)
      /* ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // Random plugins/extensions
        'Can\'t find variable: ZiteReader',
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'atomicFindClose',
        // Facebook errors
        'fb_xd_fragment',
        // Generic errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ], */

      // Deny URLs from error tracking (commented out due to type constraints)
      /* denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ], */
    });
  }
}

/**
 * Scrub sensitive data from strings
 */
function scrubSensitiveData(text: string): string {
  return text
    // Email addresses
    .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[EMAIL]')
    // Phone numbers
    .replace(/(\+?[0-9]{1,4}[\s-]?)?(\(?[0-9]{1,4}\)?[\s-]?)?[0-9]{3,4}[\s-]?[0-9]{3,4}/g, '[PHONE]')
    // Credit card numbers
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    // API keys and tokens
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[TOKEN]')
    // Passwords
    .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]');
}

/**
 * Scrub sensitive data from objects
 */
function scrubSensitiveObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'apikey',
    'api_key',
    'secret',
    'auth',
    'authorization',
    'creditcard',
    'credit_card',
    'ssn',
    'social_security',
  ];

  const scrubbed: Record<string, unknown> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        scrubbed[key] = scrubSensitiveObject(obj[key] as Record<string, unknown>);
      } else if (typeof obj[key] === 'string') {
        scrubbed[key] = scrubSensitiveData(obj[key] as string);
      } else {
        scrubbed[key] = obj[key];
      }
    }
  }

  return scrubbed;
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; username?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    // role: user.role, // Commented out due to Sentry User type constraints
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set custom context for error tracking
 */
export function setSentryContext(context: string, data: Record<string, unknown>) {
  Sentry.setContext(context, scrubSensitiveObject(data));
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data ? scrubSensitiveObject(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]: [string, any]) => {
        scope.setContext(key, scrubSensitiveObject(value as Record<string, unknown>));
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture custom message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]: [string, any]) => {
        scope.setContext(key, scrubSensitiveObject(value as Record<string, unknown>));
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  // Mock transaction object for compatibility (Sentry transaction API changes)
  return {
    setData: (key: string, value: any) => {},
    setStatus: (status: string) => {},
    finish: () => {}
  };
}

/**
 * Performance monitoring for API calls
 */
export async function monitorAPICall<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const transaction = startTransaction(name, 'http.client');

  try {
    if (context) {
      Object.entries(context).forEach(([key, value]: [string, any]) => {
        transaction.setData(key, scrubSensitiveObject(value as Record<string, unknown>));
      });
    }

    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, context);
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Performance monitoring for database queries
 */
export async function monitorDatabaseQuery<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(`db.${queryName}`, 'db.query');

  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, { query: queryName });
    throw error;
  } finally {
    transaction.finish();
  }
}