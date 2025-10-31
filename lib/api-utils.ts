// API Utilities for AUTO ANI Website
// Shared utilities for error handling, rate limiting, and response formatting

import crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

// Security utilities

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Use crypto.timingSafeEqual for true constant-time comparison
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // Ensure same length (required by timingSafeEqual)
    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Custom error classes
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ExternalAPIError extends APIError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(502, `${service} API Error: ${message}`, 'EXTERNAL_API_ERROR', {
      service,
      ...details,
    });
  }
}

// Error response formatter
export function errorResponse(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

// Success response formatter
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    meta,
  });
}

// Rate limiter using in-memory store (for production, use Redis)
class RateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      const resetAt = now + windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  cleanup() {
    clearInterval(this.cleanupInterval);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting middleware
export async function rateLimit(
  req: NextRequest,
  options: {
    maxRequests?: number;
    windowMs?: number;
    keyGenerator?: (req: NextRequest) => string;
  } = {}
): Promise<{ success: boolean; message?: string; retryAfter?: number }> {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    keyGenerator = (req) => getClientIP(req) || 'unknown',
  } = options;

  const key = keyGenerator(req);
  const result = await rateLimiter.checkLimit(key, maxRequests, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      success: false,
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      retryAfter
    };
  }

  return { success: true };
}

// Exponential backoff retry utility
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw error;
      }

      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Retry debug logging removed - use logger if needed
      // logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Request validator
export function validateRequest<T>(
  data: unknown,
  schema: {
    parse: (data: unknown) => T;
  }
): T {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error && 'errors' in error
      ? (error as { errors: unknown }).errors
      : undefined;
    throw new ValidationError('Invalid request data', { errors: errorDetails });
  }
}

// API key validator with constant-time comparison
export function validateAPIKey(
  req: NextRequest,
  expectedKey?: string
): string | null {
  const apiKey =
    req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return null;
  }

  // Use constant-time comparison to prevent timing attacks
  if (expectedKey && !constantTimeCompare(apiKey, expectedKey)) {
    return null;
  }

  return apiKey;
}

// Cache implementation
export class Cache<T> {
  private store: Map<string, { data: T; expiresAt: number }> = new Map();

  set(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }
}

// Webhook signature validator with constant-time comparison
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (_error) {
    // If buffers have different lengths, timingSafeEqual throws
    return false;
  }
}

// IP address extractor
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  // NextRequest doesn't have ip property directly
  return 'unknown';
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

// Pagination helper
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20'))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Type-safe environment variable getter
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

// Async handler wrapper for error handling
export function asyncHandler(
  handler: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: Record<string, unknown>): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}