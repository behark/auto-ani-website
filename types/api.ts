import { NextRequest, NextResponse } from 'next/server'

// Generic API handler type
export type ApiHandler<T = any, P = Record<string, string>> = (
  request: NextRequest,
  context?: { params: P }
) => Promise<NextResponse<ApiResponse<T>>>

// Standard API response wrapper
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; details?: any }

// Success response helper
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  )
}

// Error response helper
export function errorResponse(
  error: string,
  status = 500,
  code?: string,
  details?: any
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error, code, details },
    { status }
  )
}

// Validation error type
export interface ValidationError {
  field: string
  message: string
}

// Paginated response type
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

// Query parameters type
export interface QueryParams {
  page?: string
  limit?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filter parameters for vehicles
export interface VehicleFilterParams extends QueryParams {
  make?: string
  model?: string
  bodyType?: string
  fuelType?: string
  transmission?: string
  minPrice?: string
  maxPrice?: string
  minYear?: string
  maxYear?: string
  featured?: string
  status?: string
}

// Generic list response with pagination
export interface ListResponse<T> {
  items: T[]
  total: number
  pagination?: {
    page: number
    count: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Standard success message response
export interface SuccessMessageResponse {
  success: true
  message: string
}

// Standard error response
export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

// Helper to create pagination metadata
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)
  return {
    total,
    page,
    count: Math.min(limit, total - (page - 1) * limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  }
}

// Helper to parse query parameters
export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  return {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  }
}

// Helper to parse vehicle filter parameters
export function parseVehicleFilters(searchParams: URLSearchParams): VehicleFilterParams {
  return {
    ...parseQueryParams(searchParams),
    make: searchParams.get('make') || undefined,
    model: searchParams.get('model') || undefined,
    bodyType: searchParams.get('bodyType') || undefined,
    fuelType: searchParams.get('fuelType') || undefined,
    transmission: searchParams.get('transmission') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    minYear: searchParams.get('minYear') || undefined,
    maxYear: searchParams.get('maxYear') || undefined,
    featured: searchParams.get('featured') || undefined,
    status: searchParams.get('status') || undefined,
  }
}

// Health check response type
export interface HealthCheckResponse {
  success: boolean
  status: string
  timestamp: string
  checks?: {
    database?: boolean
    redis?: boolean
    [key: string]: any
  }
}
