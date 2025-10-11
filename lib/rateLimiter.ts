import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { redis } from './redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = (request: NextRequest) => getClientIdentifier(request),
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = keyGenerator(request);
    const now = Date.now();

    try {
      // Use shared Redis service with fallback
      const result = await redis.checkRateLimit(identifier, {
        maxAttempts: maxRequests,
        windowMs,
      });

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - now) / 1000);

        return NextResponse.json(
          {
            error: message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }

      return new NextResponse(null, {
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      });
    } catch (_error) {
      logger.error('Rate limiting error', {}, _error instanceof Error ? _error : new Error(String(_error)));
      // On error, allow the request to proceed
      return null;
    }
  };
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  let ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip;
}

// Different rate limiters for different endpoints
export const rateLimiters = {
  // Authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  }),

  // Registration endpoint
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later',
  }),

  // Password reset
  passwordReset: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
  }),

  // Email verification
  emailVerification: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many verification attempts, please try again later',
  }),

  // General API
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  }),

  // File uploads
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many file uploads, please try again later',
  }),

  // Contact forms
  contact: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many contact form submissions, please try again later',
  }),

  // Search
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please try again later',
  }),

  // Vehicle inquiries
  inquiry: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many inquiries, please try again later',
  }),
};

// Middleware function to apply rate limiting to API routes
// interface UpdateData {
//   count: number;
//   resetTime: number;
// }

export async function withRateLimit<T = unknown>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  limiter: ReturnType<typeof rateLimit>
): Promise<NextResponse<T>> {
  const rateLimitResult = await limiter(request);

  if (rateLimitResult instanceof NextResponse && rateLimitResult.status === 429) {
    return rateLimitResult as NextResponse<T>;
  }

  // If rate limit passed, call the handler
  const response = await handler(request);

  // If rate limiting returned headers, merge them with the response
  if (rateLimitResult && rateLimitResult.headers) {
    rateLimitResult.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Helper to create IP-based rate limiter
export function createIPRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => `ip:${getClientIdentifier(request)}`,
  });
}

// Helper to create user-based rate limiter
export function createUserRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      // Try to get user ID from session or auth header
      const userId = getUserIdFromRequest(request);
      return userId ? `user:${userId}` : `ip:${getClientIdentifier(request)}`;
    },
  });
}

// Extract user ID from request (implement based on your auth system)
function getUserIdFromRequest(request: NextRequest): string | null {
  // This would need to be implemented based on your authentication system
  // For example, parsing JWT from Authorization header
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Parse JWT and extract user ID
      // Implementation depends on your JWT structure
    }

    // Or get from session cookie
    // Implementation depends on your session system

    return null;
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return null;
  }
}

export default rateLimit;