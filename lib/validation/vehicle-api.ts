import { z } from 'zod';

// Sanitize string to prevent GROQ injection
export function sanitizeGroqParam(value: string): string {
  // Remove any quotes, backslashes, and other potentially dangerous characters
  return value.replace(/['"\\`${}]/g, '');
}

// Vehicle API query schema
export const vehicleQuerySchema = z.object({
  category: z.enum(['new', 'used', 'all']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  brand: z.string()
    .max(50)
    .transform(sanitizeGroqParam)
    .optional(),
  minPrice: z.string()
    .regex(/^\d+$/, 'Price must be a number')
    .transform(val => parseInt(val, 10))
    .optional(),
  maxPrice: z.string()
    .regex(/^\d+$/, 'Price must be a number')
    .transform(val => parseInt(val, 10))
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100'
    })
    .optional(),
});

export type VehicleQueryParams = z.infer<typeof vehicleQuerySchema>;

// Validate and sanitize search params
export function validateVehicleQuery(searchParams: URLSearchParams): {
  success: boolean;
  data?: VehicleQueryParams;
  error?: string;
} {
  try {
    const rawParams = {
      category: searchParams.get('category') || undefined,
      featured: searchParams.get('featured') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validated = vehicleQuerySchema.parse(rawParams);

    // Additional validation: maxPrice should be greater than minPrice
    if (validated.minPrice && validated.maxPrice && validated.maxPrice < validated.minPrice) {
      return {
        success: false,
        error: 'Maximum price must be greater than minimum price'
      };
    }

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: message };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}