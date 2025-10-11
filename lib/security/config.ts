/**
 * Centralized Security Configuration
 *
 * This file contains all security-related configurations and policies
 * for the AUTO ANI website application
 */

/**
 * Authentication Configuration
 */
export const authConfig = {
  // Session settings
  session: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    updateAge: 60 * 60, // Update session every hour
    strategy: 'database' as const, // Use database sessions for better security
  },

  // Password policies
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{};\':"|,.<>/?',
    preventCommonPasswords: true,
    preventRepeatingChars: 3, // Max 3 repeating characters
    hashRounds: 12, // bcrypt rounds
  },

  // Account lockout policies
  lockout: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockDurationMinutes: 15,
    increaseLockDuration: true, // Double lock duration on repeated lockouts
  },

  // Multi-factor authentication
  mfa: {
    enabled: true,
    required: ['ADMIN'], // Required for these roles
    methods: ['TOTP', 'SMS', 'EMAIL'],
    backupCodes: 10,
    totpWindow: 1, // Allow 1 time step tolerance
  },

  // JWT settings
  jwt: {
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256' as const,
    issuer: 'autosalonani.com',
    audience: 'autosalonani.com',
  },

  // OAuth providers (if needed)
  oauth: {
    google: {
      enabled: false,
      scopes: ['email', 'profile'],
    },
    facebook: {
      enabled: false,
      scopes: ['email', 'public_profile'],
    },
  },
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  // Global rate limits
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },

  // Endpoint-specific limits
  endpoints: {
    // Authentication endpoints
    '/api/auth/login': {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      skipSuccessfulRequests: true,
    },
    '/api/auth/register': {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    },
    '/api/auth/password-reset': {
      windowMs: 15 * 60 * 1000,
      maxRequests: 3,
    },

    // API endpoints
    '/api/appointments': {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    },
    '/api/vehicles/search': {
      windowMs: 1 * 60 * 1000,
      maxRequests: 30,
    },
    '/api/contact': {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    },

    // File uploads
    '/api/upload': {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  },

  // IP-based blocking
  ipBlocking: {
    enabled: true,
    maxViolations: 10,
    blockDurationHours: 24,
    whitelistedIPs: [], // Add trusted IPs here
    blacklistedIPs: [], // Add permanently blocked IPs here
  },
};

/**
 * CORS Configuration
 */
export const corsConfig = {
  // Allowed origins
  origins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://autosalonani.com',
    'https://www.autosalonani.com',
  ],

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
  ],

  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],

  // Credentials
  credentials: true,

  // Max age for preflight cache
  maxAge: 86400, // 24 hours
};

/**
 * Content Security Policy Configuration
 */
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'strict-dynamic'",
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://connect.facebook.net',
      'https://maps.googleapis.com',
    ],
    styleSrc: [
      "'self'",
      'https://fonts.googleapis.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://images.unsplash.com',
      'https://cdn.carfax.com',
      'https://www.autocheck.com',
    ],
    fontSrc: [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com',
      'https://sentry.io',
      'https://*.sentry.io',
      'https://api.posthog.com',
      'https://api.stripe.com',
      'wss://',
    ],
    frameSrc: [
      "'self'",
      'https://www.google.com',
      'https://www.facebook.com',
      'https://checkout.stripe.com',
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: [
      "'self'",
      'https://checkout.stripe.com',
    ],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true,
    blockAllMixedContent: true,
  },

  // Report URI for CSP violations
  reportUri: process.env.CSP_REPORT_URI || '/api/security-reports',
};

/**
 * Security Headers Configuration
 */
export const securityHeaders = {
  // Transport Security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Content Type Options
  'X-Content-Type-Options': 'nosniff',

  // Frame Options
  'X-Frame-Options': 'DENY',

  // XSS Protection (disabled in modern browsers, CSP is better)
  'X-XSS-Protection': '0',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self)',
    'usb=()',
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Additional Security
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'on',
  'X-Download-Options': 'noopen',
  'Expect-CT': 'max-age=86400, enforce',
};

/**
 * Input Validation Rules
 */
export const validationRules = {
  // Field length limits
  lengths: {
    username: { min: 3, max: 30 },
    email: { max: 254 },
    password: { min: 8, max: 128 },
    name: { min: 2, max: 100 },
    phone: { min: 8, max: 20 },
    message: { max: 1000 },
    notes: { max: 1000 },
    address: { max: 200 },
    city: { max: 100 },
    postalCode: { max: 20 },
    url: { max: 2000 },
    fileName: { max: 255 },
  },

  // Regex patterns
  patterns: {
    username: /^[a-zA-Z0-9_-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[\d\s()-]+$/,
    postalCode: /^[A-Z0-9\s-]+$/i,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    slug: /^[a-z0-9-]+$/,
  },

  // File upload restrictions
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
    scanForViruses: true,
  },
};

/**
 * API Security Configuration
 */
export const apiSecurity = {
  // API key settings
  apiKey: {
    enabled: false,
    header: 'X-API-Key',
    rotationDays: 90,
    revokeOnSuspiciousActivity: true,
  },

  // Request signing
  signing: {
    enabled: false,
    algorithm: 'HMAC-SHA256',
    header: 'X-Signature',
    timestampHeader: 'X-Timestamp',
    maxTimestampAge: 5 * 60 * 1000, // 5 minutes
  },

  // Response security
  response: {
    removeServerHeader: true,
    addRequestId: true,
    maskSensitiveData: true,
    compressResponses: true,
  },

  // Webhook security
  webhooks: {
    verifySignatures: true,
    replayProtection: true,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  },
};

/**
 * Data Protection Configuration
 */
export const dataProtection = {
  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
    encryptPII: true,
    encryptPaymentData: true,
  },

  // Data retention policies
  retention: {
    userDataDays: 365 * 2, // 2 years
    logDataDays: 90,
    sessionDataDays: 30,
    tempDataHours: 24,
  },

  // GDPR compliance
  gdpr: {
    enabled: true,
    consentRequired: true,
    rightToErasure: true,
    dataPortability: true,
    breachNotificationHours: 72,
  },

  // PII handling
  pii: {
    maskInLogs: true,
    maskInErrors: true,
    fields: ['email', 'phone', 'ssn', 'creditCard', 'dateOfBirth'],
  },
};

/**
 * Monitoring and Alerting Configuration
 */
export const monitoringConfig = {
  // Security events to monitor
  events: {
    loginFailures: { threshold: 5, window: '15m' },
    rateLimitViolations: { threshold: 10, window: '1h' },
    suspiciousActivity: { threshold: 3, window: '1h' },
    sqlInjectionAttempts: { threshold: 1, window: '24h' },
    xssAttempts: { threshold: 1, window: '24h' },
  },

  // Alert channels
  alerts: {
    email: {
      enabled: true,
      recipients: [process.env.SECURITY_ALERT_EMAIL || 'security@autosalonani.com'],
      severities: ['CRITICAL', 'HIGH'],
    },
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#security-alerts',
      severities: ['CRITICAL', 'HIGH', 'MEDIUM'],
    },
    sms: {
      enabled: false,
      recipients: [process.env.SECURITY_ALERT_PHONE],
      severities: ['CRITICAL'],
    },
  },

  // Audit logging
  audit: {
    enabled: true,
    logAllRequests: false,
    logAuthEvents: true,
    logDataAccess: true,
    logConfigChanges: true,
    retentionDays: 365,
  },
};

/**
 * Environment-specific overrides
 */
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV;

  if (env === 'development') {
    // Relax some restrictions in development
    return {
      ...authConfig,
      lockout: {
        ...authConfig.lockout,
        maxAttempts: 10,
      },
      rateLimiting: {
        ...rateLimitConfig,
        global: {
          ...rateLimitConfig.global,
          maxRequests: 10000,
        },
      },
    };
  }

  if (env === 'test') {
    // Test environment configuration
    return {
      ...authConfig,
      mfa: {
        ...authConfig.mfa,
        enabled: false,
      },
    };
  }

  // Production configuration (default)
  return {
    authConfig,
    rateLimitConfig,
    corsConfig,
    cspConfig,
    securityHeaders,
    validationRules,
    apiSecurity,
    dataProtection,
    monitoringConfig,
  };
};

export default getSecurityConfig();