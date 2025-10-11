// Centralized error handling utilities for AUTO ANI Website
// Provides consistent error responses and logging across all API routes

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
}

// Standard error response format
export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// API Response type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

class ApiError extends Error {
  public type: ErrorType;
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Predefined error creators
export const createValidationError = (message: string, details?: any) =>
  new ApiError(ErrorType.VALIDATION, message, 400, 'VALIDATION_FAILED', details);

export const createAuthenticationError = (message: string = 'Authentication required') =>
  new ApiError(ErrorType.AUTHENTICATION, message, 401, 'AUTH_REQUIRED');

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  new ApiError(ErrorType.AUTHORIZATION, message, 403, 'INSUFFICIENT_PERMISSIONS');

export const createNotFoundError = (resource: string = 'Resource') =>
  new ApiError(ErrorType.NOT_FOUND, `${resource} not found`, 404, 'NOT_FOUND');

export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  new ApiError(ErrorType.RATE_LIMIT, message, 429, 'RATE_LIMIT_EXCEEDED');

export const createDatabaseError = (message: string, details?: any) =>
  new ApiError(ErrorType.DATABASE, message, 500, 'DATABASE_ERROR', details);

export const createExternalApiError = (service: string, message?: string) =>
  new ApiError(
    ErrorType.EXTERNAL_API,
    message || `External service ${service} is unavailable`,
    502,
    'EXTERNAL_API_ERROR'
  );

export const createInternalError = (message: string = 'Internal server error') =>
  new ApiError(ErrorType.INTERNAL, message, 500, 'INTERNAL_ERROR');

export const createBadRequestError = (message: string, details?: any) =>
  new ApiError(ErrorType.BAD_REQUEST, message, 400, 'BAD_REQUEST', details);

export const createConflictError = (message: string, details?: any) =>
  new ApiError(ErrorType.CONFLICT, message, 409, 'CONFLICT', details);

// Error detection and conversion
function convertKnownErrors(error: any): ApiError {
  // Zod validation errors
  if (error instanceof ZodError) {
    return createValidationError(
      'Invalid input data',
      error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return createConflictError(
          'A record with this information already exists',
          { field: error.meta?.target }
        );
      case 'P2025':
        return createNotFoundError('Record');
      case 'P2003':
        return createBadRequestError(
          'Referenced record does not exist',
          { field: error.meta?.field_name }
        );
      case 'P2014':
        return createBadRequestError(
          'Invalid relation',
          { relation: error.meta?.relation_name }
        );
      default:
        return createDatabaseError(`Database operation failed: ${error.message}`);
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createValidationError('Invalid database query parameters');
  }

  // NextAuth.js errors
  if (error.name === 'CredentialsSignin') {
    return createAuthenticationError('Invalid credentials');
  }

  // Network/fetch errors
  if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
    return createExternalApiError('External service', error.message);
  }

  // Rate limiting errors (if using rate limiting library)
  if (error.name === 'TooManyRequestsError') {
    return createRateLimitError(error.message);
  }

  // Default to internal error
  return createInternalError(
    process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  );
}

// Main error handler function
export function handleApiError(
  error: any,
  request?: NextRequest,
  context?: Record<string, any>
): NextResponse<ErrorResponse> {
  const apiError = error instanceof ApiError ? error : convertKnownErrors(error);

  // Extract request information for logging
  const requestInfo = request ? {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
  } : {};

  // Log the error
  logger.apiError(
    `${apiError.type}: ${apiError.message}`,
    error,
    {
      ...requestInfo,
      ...context,
    }
  );

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      type: apiError.type,
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(errorResponse, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

// Async handler wrapper with error handling
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

// Validation middleware
export function validateInput<T>(
  schema: any,
  data: any
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw createValidationError(
        'Invalid input data',
        error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }
    throw error;
  }
}

// Rate limiting helper
export function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  // Simple in-memory rate limiting for development
  // In production, use Redis or similar
  if (process.env.NODE_ENV === 'development') {
    return true; // Skip rate limiting in development
  }

  // This would need to be implemented with Redis in production
  // For now, return true to allow requests
  return true;
}

// Security helpers
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

// SQL injection detection
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /('|(\\'))+.*(drop|alter|create|truncate|delete|union|select|insert|update|exec|execute)/i,
    /(union|select|insert|delete|update|drop|alter|create|truncate).+from/i,
    /\b(or|and)\s+\d+\s*=\s*\d+/i,
    /['"];?\s*(drop|alter|create|truncate|delete)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

// Default export
export default {
  handleApiError,
  createSuccessResponse,
  withErrorHandler,
  validateInput,
  ApiError,
  ErrorType,
};