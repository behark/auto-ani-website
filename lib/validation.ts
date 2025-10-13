import { z, ZodError } from 'zod'
import { NextRequest } from 'next/server'
import { errorResponse } from '@/types/api'

// Helper to validate request body against a Zod schema
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.Schema<T>
): Promise<{ data: T } | { error: ReturnType<typeof errorResponse> }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: errorResponse(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          (error as any).errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        )
      }
    }
    if (error instanceof SyntaxError) {
      return {
        error: errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON')
      }
    }
    return {
      error: errorResponse('Invalid request body', 400)
    }
  }
}

// Helper to validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.Schema<T>
): { data: T } | { error: ReturnType<typeof errorResponse> } {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          (error as any).errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        )
      }
    }
    return {
      error: errorResponse('Invalid query parameters', 400)
    }
  }
}

// Vehicle validation schemas
export const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive('Price must be positive'),
  mileage: z.number().nonnegative('Mileage cannot be negative'),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'DUAL_CLUTCH']),
  bodyType: z.enum(['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'WAGON', 'VAN', 'TRUCK', 'CONVERTIBLE']),
  color: z.string().min(1).max(30),
  engineSize: z.string().max(20),
  drivetrain: z.enum(['FWD', 'RWD', 'AWD', '4WD']),
  features: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  description: z.string().max(2000).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['AVAILABLE', 'SOLD', 'RESERVED', 'PENDING']).optional(),
  vin: z.string().length(17).optional(),
  doors: z.number().int().min(2).max(6).optional(),
  seats: z.number().int().min(2).max(9).optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial()

// Appointment validation schemas
export const createAppointmentSchema = z.object({
  type: z.enum(['TEST_DRIVE', 'INSPECTION', 'SERVICE', 'CONSULTATION', 'DELIVERY']),
  vehicleId: z.string().uuid().optional().nullable(),
  customerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  customerEmail: z.string()
    .email('Invalid email address'),
  customerPhone: z.string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must be less than 20 digits'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  reminderMethod: z.enum(['EMAIL', 'SMS', 'PUSH']).optional(),
})

export const updateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name contains invalid characters'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  phone: z.string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  vehicleId: z.string().uuid().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(), // Should be empty
  captcha: z.string().min(1, 'CAPTCHA verification required'),
  consent: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  csrfToken: z.string().min(1, 'CSRF token required'),
})

// Trade-in validation schema
export const createTradeInSchema = z.object({
  customerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  customerEmail: z.string()
    .email('Invalid email address'),
  customerPhone: z.string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .optional(),
  vehicleMake: z.string().min(1, 'Vehicle make is required').max(50),
  vehicleModel: z.string().min(1, 'Vehicle model is required').max(50),
  vehicleYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vehicleMileage: z.number().int().nonnegative('Mileage cannot be negative'),
  vehicleCondition: z.enum(['excellent', 'very_good', 'good', 'fair', 'poor']),
  hasAccidents: z.boolean().optional(),
  hasServiceHistory: z.boolean().optional(),
  vehiclePhotos: z.array(z.string().url()).optional(),
  additionalInfo: z.string().max(1000).optional(),
})

// Promotion validation schema
export const createPromotionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BOGO']),
  value: z.number().positive('Value must be positive'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format'),
  conditions: z.object({
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    applicableVehicles: z.array(z.string()).optional(),
    applicableParts: z.array(z.string()).optional(),
    customerSegments: z.array(z.string()).optional(),
    maxUses: z.number().int().positive().optional(),
    maxUsesPerCustomer: z.number().int().positive().optional(),
  }).optional(),
})

// Inventory alert validation schema
export const createInventoryAlertSchema = z.object({
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().min(2).max(100).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  maxPrice: z.number().positive().optional(),
  minYear: z.number().int().min(1900).optional(),
  maxMileage: z.number().int().nonnegative().optional(),
  bodyType: z.string().max(20).optional(),
  fuelType: z.string().max(20).optional(),
})

// Testimonial validation schema
export const createTestimonialSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10).max(1000),
  photos: z.array(z.string().url()).optional(),
  location: z.string().max(100).optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

export const vehicleFilterSchema = paginationSchema.extend({
  make: z.string().optional(),
  model: z.string().optional(),
  bodyType: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  minPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
  minYear: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxYear: z.string().regex(/^\d+$/).transform(Number).optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
})

// Sanitization helpers
export function sanitizeTextInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove special characters
    .trim()
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim()
}

// Validation helpers
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/
  return phoneRegex.test(phone)
}

// Rate limiting helper types
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const rateLimitConfigs = {
  contact: { maxRequests: 3, windowMs: 10 * 60 * 1000 }, // 3 per 10 minutes
  appointment: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  tradeIn: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  general: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
}
