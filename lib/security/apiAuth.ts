/**
 * API Authentication Middleware
 *
 * Provides comprehensive authentication and authorization for API routes
 * with multiple security layers and attack prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimiter';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * API Security Configuration
 */
export interface ApiSecurityConfig {
  requireAuth?: boolean;
  requireRole?: string | string[];
  rateLimit?: keyof typeof rateLimiters;
  validateBody?: z.ZodSchema;
  allowedMethods?: string[];
  allowedOrigins?: string[];
  requireApiKey?: boolean;
  requireSignature?: boolean;
  maxBodySize?: number;
}

/**
 * Extract and validate Bearer token from request
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Validate API Key
 */
async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return false;
  }

  // Hash the API key for comparison (never store plain text API keys)
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  // In production, check against database
  // For now, check against environment variable
  const validApiKeyHash = process.env.API_KEY_HASH;

  if (!validApiKeyHash) {
    logger.warn('API key validation requested but API_KEY_HASH not configured');
    return false;
  }

  return hashedKey === validApiKeyHash;
}

/**
 * Validate request signature (webhook security)
 */
function validateSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-signature');
  const timestamp = request.headers.get('x-timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const timestampNum = parseInt(timestamp);
  const now = Date.now();
  if (Math.abs(now - timestampNum) > 5 * 60 * 1000) {
    logger.warn('Request signature timestamp outside acceptable window');
    return false;
  }

  // Compute expected signature
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('Signature validation requested but WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Check if user has required role(s)
 */
function hasRequiredRole(userRole: string, requiredRoles: string | string[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Admin can access everything
  if (userRole === 'ADMIN') {
    return true;
  }

  return roles.includes(userRole);
}

/**
 * Validate request origin for CORS
 */
function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');

  if (!origin) {
    // No origin header (same-origin request)
    return true;
  }

  // Check if origin is in allowed list
  for (const allowed of allowedOrigins) {
    if (allowed === '*') {
      return true;
    }

    if (allowed.includes('*')) {
      // Wildcard pattern matching
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    } else if (origin === allowed) {
      return true;
    }
  }

  return false;
}

/**
 * Main API security middleware
 */
export async function withApiSecurity<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config: ApiSecurityConfig = {}
): Promise<NextResponse<T | { error: string } | { error: string; details: any }>> {
  const {
    requireAuth = true,
    requireRole,
    rateLimit = 'api',
    validateBody,
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
    requireApiKey = false,
    requireSignature = false,
    maxBodySize = 10 * 1024 * 1024, // 10MB default
  } = config;

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to response headers
  const securityHeaders = {
    'X-Request-ID': requestId,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };

  try {
    // 1. Check HTTP method
    if (!allowedMethods.includes(request.method)) {
      logger.warn('Method not allowed', {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405, headers: securityHeaders }
      );
    }

    // 2. Validate origin
    if (!validateOrigin(request, allowedOrigins)) {
      logger.warn('Invalid origin', {
        requestId,
        origin: request.headers.get('origin'),
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403, headers: securityHeaders }
      );
    }

    // 3. Apply rate limiting
    const rateLimiter = rateLimiters[rateLimit];
    if (rateLimiter) {
      const rateLimitResult = await rateLimiter(request);
      if (rateLimitResult && rateLimitResult.status === 429) {
        logger.warn('Rate limit exceeded', {
          requestId,
          path: request.nextUrl.pathname,
        });
        return rateLimitResult as NextResponse<T>;
      }
    }

    // 4. Check API key if required
    if (requireApiKey) {
      const validApiKey = await validateApiKey(request);
      if (!validApiKey) {
        logger.warn('Invalid API key', {
          requestId,
          path: request.nextUrl.pathname,
        });

        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401, headers: securityHeaders }
        );
      }
    }

    // 5. Validate request body
    let body: any = null;
    if (validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const rawBody = await request.text();

        // Check body size
        if (rawBody.length > maxBodySize) {
          return NextResponse.json(
            { error: 'Request body too large' },
            { status: 413, headers: securityHeaders }
          );
        }

        // Validate signature if required
        if (requireSignature && !validateSignature(request, rawBody)) {
          logger.warn('Invalid request signature', {
            requestId,
            path: request.nextUrl.pathname,
          });

          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401, headers: securityHeaders }
          );
        }

        // Parse JSON
        body = JSON.parse(rawBody);

        // Validate against schema
        const validationResult = validateBody.safeParse(body);
        if (!validationResult.success) {
          logger.warn('Request body validation failed', {
            requestId,
            errors: validationResult.error.issues,
          });

          return NextResponse.json(
            {
              error: 'Validation failed',
              details: validationResult.error.issues,
            },
            { status: 400, headers: securityHeaders }
          );
        }

        body = validationResult.data;
      } catch (error) {
        logger.error('Error parsing request body', { requestId }, error as Error);

        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400, headers: securityHeaders }
        );
      }
    }

    // 6. Authentication check
    let session = null;
    let user = null;

    if (requireAuth) {
      // Try session-based auth first
      session = await getServerSession(authOptions);

      if (!session) {
        // Try JWT bearer token
        const token = extractBearerToken(request);
        if (token) {
          try {
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!
            ) as any;

            user = {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
              username: decoded.username,
            };
          } catch (error) {
            logger.warn('Invalid JWT token', { requestId });
          }
        }
      } else {
        user = session.user;
      }

      if (!user) {
        logger.warn('Unauthorized access attempt', {
          requestId,
          path: request.nextUrl.pathname,
        });

        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: securityHeaders }
        );
      }

      // 7. Authorization check
      if (requireRole && !hasRequiredRole(user.role, requireRole)) {
        logger.warn('Insufficient permissions', {
          requestId,
          userId: user.id,
          userRole: user.role,
          requireRole,
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403, headers: securityHeaders }
        );
      }
    }

    // 8. Call the actual handler with context
    const context = {
      user,
      session,
      body,
      requestId,
    };

    const response = await handler(request, context);

    // Add security headers to response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Log successful request
    const duration = Date.now() - startTime;
    logger.info('API request completed', {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      duration,
      userId: user?.id,
    });

    return response;
  } catch (error) {
    // Log error
    logger.error('API request failed', {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, error as Error);

    // Return generic error to prevent information leakage
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    );
  }
}

/**
 * Create protected API handler with specific configuration
 */
export function createProtectedHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config?: ApiSecurityConfig
) {
  return (request: NextRequest) => withApiSecurity(request, handler, config);
}

/**
 * Public API handler (no auth required but with rate limiting)
 */
export function createPublicHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config?: Omit<ApiSecurityConfig, 'requireAuth'>
) {
  return (request: NextRequest) =>
    withApiSecurity(request, handler, {
      ...config,
      requireAuth: false,
    });
}

/**
 * Admin-only API handler
 */
export function createAdminHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config?: Omit<ApiSecurityConfig, 'requireRole'>
) {
  return (request: NextRequest) =>
    withApiSecurity(request, handler, {
      ...config,
      requireRole: 'ADMIN',
    });
}

/**
 * Webhook handler with signature verification
 */
export function createWebhookHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config?: Omit<ApiSecurityConfig, 'requireSignature' | 'requireAuth'>
) {
  return (request: NextRequest) =>
    withApiSecurity(request, handler, {
      ...config,
      requireSignature: true,
      requireAuth: false,
    });
}

/**
 * Generate API key for a user
 */
export function generateApiKey(): { key: string; hash: string } {
  const key = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, hash };
}

/**
 * Middleware to log API access
 */
export async function logApiAccess(
  request: NextRequest,
  response: NextResponse,
  context: any
) {
  const { user, requestId } = context;

  await logger.audit('API Access', {
    requestId,
    userId: user?.id,
    method: request.method,
    path: request.nextUrl.pathname,
    status: response.status,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent'),
  });
}

export default withApiSecurity;