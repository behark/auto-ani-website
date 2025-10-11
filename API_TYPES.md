# AUTO ANI API Types Documentation

## Overview

This document provides comprehensive documentation for all API routes in the AUTO ANI dealership website, including TypeScript types, request/response formats, validation rules, and error codes.

## Table of Contents

1. [Core Type System](#core-type-system)
2. [Vehicles API](#vehicles-api)
3. [Appointments API](#appointments-api)
4. [Contact API](#contact-api)
5. [Trade-In API](#trade-in-api)
6. [Error Handling](#error-handling)
7. [Validation](#validation)

---

## Core Type System

### Base API Types (`/types/api.ts`)

#### ApiResponse<T>

Standard wrapper for all API responses:

```typescript
type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; details?: any }
```

#### Helper Functions

```typescript
// Success response
successResponse<T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>>

// Error response
errorResponse(error: string, status = 500, code?: string, details?: any): NextResponse<ApiResponse<never>>

// Create pagination metadata
createPaginationMeta(total: number, page: number, limit: number)

// Parse query parameters
parseQueryParams(searchParams: URLSearchParams): QueryParams
parseVehicleFilters(searchParams: URLSearchParams): VehicleFilterParams
```

---

## Vehicles API

### GET /api/vehicles

Fetch a paginated list of vehicles with optional filters.

#### Request Parameters

```typescript
interface VehicleFilterParams {
  page?: string           // Default: '1'
  limit?: string          // Default: '12'
  make?: string
  model?: string
  bodyType?: string
  fuelType?: string
  transmission?: string
  minPrice?: string
  maxPrice?: string
  minYear?: string
  maxYear?: string
  featured?: string       // 'true' | 'false'
  status?: string         // Default: 'AVAILABLE'
  sortBy?: string         // Default: 'featured DESC, "createdAt" DESC'
}
```

#### Response

```typescript
interface GetVehiclesResponse {
  vehicles: Vehicle[]
  total: number
  pagination: {
    total: number
    count: number
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

#### Example Request

```bash
GET /api/vehicles?page=1&limit=12&make=BMW&minPrice=20000&maxPrice=50000
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "uuid-1234",
        "slug": "bmw-x5-2022",
        "make": "BMW",
        "model": "X5",
        "year": 2022,
        "price": 45000,
        "mileage": 15000,
        "fuelType": "PETROL",
        "transmission": "AUTOMATIC",
        "bodyType": "SUV",
        "color": "Black",
        "featured": true,
        "status": "AVAILABLE"
      }
    ],
    "total": 24,
    "pagination": {
      "total": 24,
      "count": 12,
      "page": 1,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### GET /api/vehicles/[id]

Get a single vehicle by ID or slug, with similar vehicles.

#### Request Parameters

- `id`: Vehicle ID (UUID) or slug (string)

#### Response

```typescript
interface GetVehicleByIdResponse {
  vehicle: Vehicle
  similarVehicles: Partial<Vehicle>[]
}
```

#### Error Codes

- `MISSING_ID` (400): Vehicle ID not provided
- `NOT_FOUND` (404): Vehicle not found
- `FETCH_ERROR` (500): Server error fetching vehicle

---

## Appointments API

### GET /api/appointments

List appointments or check availability.

#### Check Availability

```bash
GET /api/appointments?action=availability&date=2025-10-15&vehicleId=uuid-1234
```

**Response:**

```typescript
interface GetAppointmentsAvailabilityResponse {
  availability: AppointmentAvailabilitySlot[]
  businessHours: {
    open: string  // HH:MM format
    close: string // HH:MM format
  }
}

interface AppointmentAvailabilitySlot {
  time: string      // HH:MM format
  available: boolean
  duration: number  // minutes
}
```

#### List Appointments

```bash
GET /api/appointments?vehicleId=uuid-1234&status=SCHEDULED
```

**Response:**

```typescript
interface GetAppointmentsResponse {
  appointments: Appointment[]
}
```

### POST /api/appointments

Create a new appointment.

#### Request Body

```typescript
interface CreateAppointmentRequest {
  type: 'TEST_DRIVE' | 'INSPECTION' | 'SERVICE' | 'CONSULTATION' | 'DELIVERY'
  vehicleId?: string | null          // UUID
  customerName: string               // 2-100 chars
  customerEmail: string              // Valid email
  customerPhone: string              // 8-20 chars
  scheduledDate: string              // YYYY-MM-DD
  scheduledTime: string              // HH:MM (24-hour)
  duration: number                   // 15-480 minutes
  notes?: string                     // Max 1000 chars
  reminderMethod?: 'EMAIL' | 'SMS' | 'PUSH'
}
```

#### Response

```typescript
interface CreateAppointmentResponse {
  appointment: Appointment
  message: string
}
```

#### Example Request

```json
{
  "type": "TEST_DRIVE",
  "vehicleId": "uuid-1234",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "scheduledDate": "2025-10-15",
  "scheduledTime": "14:30",
  "duration": 60,
  "notes": "Interested in the BMW X5",
  "reminderMethod": "EMAIL"
}
```

#### Validation Rules

- **Date**: Cannot be in the past
- **Time**: Must be within business hours
- **Business Hours**: Mon-Fri 09:00-18:00, Sat 10:00-16:00, Closed Sunday
- **Time Slots**: 30-minute intervals
- **Buffer**: 15-minute buffer between appointments

#### Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `MISSING_DATE` (400): Date required for availability check
- `INVALID_DATE` (400): Invalid date format
- `PAST_DATE` (400): Cannot schedule in the past
- `PAST_TIME` (400): Time is in the past
- `CLOSED` (400): Business is closed on selected day
- `OUTSIDE_HOURS` (400): Time is outside business hours
- `SLOT_UNAVAILABLE` (400): Time slot already booked
- `VEHICLE_NOT_FOUND` (404): Vehicle does not exist
- `CREATE_ERROR` (500): Failed to create appointment

### PATCH /api/appointments?id={appointmentId}

Update an existing appointment.

#### Request Body

```typescript
interface UpdateAppointmentRequest {
  status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string  // Max 1000 chars
}
```

#### Error Codes

- `MISSING_ID` (400): Appointment ID required
- `NOT_FOUND` (404): Appointment not found
- `UPDATE_ERROR` (500): Failed to update

### DELETE /api/appointments?id={appointmentId}

Cancel an appointment (sets status to CANCELLED).

---

## Contact API

### POST /api/contact

Submit a contact form inquiry.

#### Request Body

```typescript
interface ContactFormRequest {
  name: string              // 2-50 chars, letters only
  email: string             // Valid email, max 254 chars
  phone?: string            // 8-20 chars, optional
  message: string           // 10-1000 chars
  vehicleId?: string        // UUID, optional
  honeypot?: string         // Should be empty (bot detection)
  captcha: string           // Required
  consent: boolean          // Must be true
  csrfToken: string         // Required
}
```

#### Response

```typescript
interface ContactFormResponse {
  message: string
  submissionId: string
}
```

#### Example Request

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "message": "I'm interested in the BMW X5. When can I schedule a test drive?",
  "vehicleId": "uuid-1234",
  "captcha": "captcha-token",
  "consent": true,
  "csrfToken": "csrf-token-value"
}
```

#### Rate Limiting

- **Limit**: 3 requests per 10 minutes per IP address
- **Error Code**: `RATE_LIMIT` (429)

#### Security Features

1. **Honeypot Field**: Bot detection
2. **CAPTCHA**: Required verification
3. **Rate Limiting**: IP-based throttling
4. **Input Sanitization**: HTML/special char removal
5. **CSRF Protection**: Token validation

#### Error Codes

- `VALIDATION_ERROR` (400): Invalid input
- `RATE_LIMIT` (429): Too many requests
- `VEHICLE_NOT_FOUND` (404): Invalid vehicle ID
- `SUBMISSION_ERROR` (500): Failed to submit

### GET /api/contact

Health check endpoint.

---

## Trade-In API

### GET /api/trade-in

Get trade-in valuations (paginated).

#### Query Parameters

- `status?: string` - Filter by status
- `limit?: string` - Results per page (default: 20)

#### Response

```typescript
interface GetTradeInValuationsResponse {
  valuations: TradeInValuation[]
  total: number
}
```

### POST /api/trade-in

Submit a trade-in valuation request.

#### Request Body

```typescript
interface CreateTradeInRequest {
  customerName: string              // Required
  customerEmail: string             // Valid email
  customerPhone?: string            // Optional
  vehicleMake: string               // Required
  vehicleModel: string              // Required
  vehicleYear: number               // 1900 to current year + 1
  vehicleMileage: number            // Non-negative
  vehicleCondition: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor'
  hasAccidents?: boolean            // Default: false
  hasServiceHistory?: boolean       // Default: false
  vehiclePhotos?: string[]          // Array of URLs
  additionalInfo?: string           // Max 1000 chars
}
```

#### Response

```typescript
interface CreateTradeInResponse {
  valuation: Partial<TradeInValuation>
  estimatedValue: number     // Offer value (85% of market)
  marketValue: number        // Calculated market value
  message: string
}
```

#### Valuation Algorithm

The system calculates market value based on:

1. **Base Value**: $20,000
2. **Make Multiplier**:
   - Luxury (Porsche, Jaguar, Land Rover): 1.8x
   - Premium (BMW, Mercedes, Audi, Lexus, Volvo): 1.3x
3. **Depreciation**: 15% per year
4. **Mileage Factor**: Based on 15,000 km/year average
5. **Condition Multiplier**:
   - Excellent: 1.1x
   - Very Good: 1.0x
   - Good: 0.85x
   - Fair: 0.65x
   - Poor: 0.4x
6. **Accidents**: -25% if yes
7. **Service History**: -15% if no

**Offer Value**: 85% of calculated market value

#### Error Codes

- `VALIDATION_ERROR` (400): Missing required fields
- `SUBMISSION_ERROR` (500): Failed to submit

---

## Error Handling

### Standard Error Response

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",           // Optional
  "details": any                  // Optional, includes validation errors
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `MISSING_ID` | 400 | Required ID parameter missing |
| `MISSING_DATE` | 400 | Required date parameter missing |
| `INVALID_DATE` | 400 | Invalid date format |
| `INVALID_JSON` | 400 | Malformed JSON in request body |
| `PAST_DATE` | 400 | Date is in the past |
| `PAST_TIME` | 400 | Time is in the past |
| `CLOSED` | 400 | Business closed on selected day |
| `OUTSIDE_HOURS` | 400 | Time outside business hours |
| `SLOT_UNAVAILABLE` | 400 | Appointment slot not available |
| `NOT_FOUND` | 404 | Resource not found |
| `VEHICLE_NOT_FOUND` | 404 | Vehicle not found |
| `RATE_LIMIT` | 429 | Too many requests |
| `FETCH_ERROR` | 500 | Failed to fetch data |
| `CREATE_ERROR` | 500 | Failed to create resource |
| `UPDATE_ERROR` | 500 | Failed to update resource |
| `DELETE_ERROR` | 500 | Failed to delete resource |
| `SUBMISSION_ERROR` | 500 | Failed to submit form |
| `HEALTH_CHECK_FAILED` | 503 | Service unavailable |

### Validation Error Details

When `code` is `VALIDATION_ERROR`, the `details` field contains an array of field-specific errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "customerEmail",
      "message": "Invalid email address"
    },
    {
      "field": "scheduledDate",
      "message": "Invalid date format (YYYY-MM-DD)"
    }
  ]
}
```

---

## Validation

### Input Validation with Zod

All API routes use Zod schemas for validation. Located in `/lib/validation.ts`.

#### Available Schemas

- `createVehicleSchema`: Vehicle creation/update
- `createAppointmentSchema`: Appointment booking
- `updateAppointmentSchema`: Appointment updates
- `contactFormSchema`: Contact form submissions
- `createTradeInSchema`: Trade-in valuations
- `createPromotionSchema`: Promotions
- `createInventoryAlertSchema`: Inventory alerts
- `createTestimonialSchema`: Testimonials

#### Sanitization Functions

```typescript
sanitizeTextInput(input: string): string    // Remove HTML tags and special chars
sanitizeEmail(email: string): string        // Lowercase and trim
sanitizePhone(phone: string): string        // Remove non-phone characters
```

#### Validation Helpers

```typescript
isValidUUID(uuid: string): boolean
isValidEmail(email: string): boolean
isValidPhone(phone: string): boolean
```

---

## Rate Limiting

### Configuration (`/lib/validation.ts`)

```typescript
const rateLimitConfigs = {
  contact: { maxRequests: 3, windowMs: 10 * 60 * 1000 },    // 3 per 10 minutes
  appointment: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  tradeIn: { maxRequests: 3, windowMs: 60 * 60 * 1000 },     // 3 per hour
  general: { maxRequests: 100, windowMs: 60 * 1000 },        // 100 per minute
}
```

---

## Usage Examples

### TypeScript Client Example

```typescript
import type { CreateAppointmentRequest, CreateAppointmentResponse } from '@/types/routes'
import type { ApiResponse } from '@/types/api'

async function bookAppointment(data: CreateAppointmentRequest) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const result: ApiResponse<CreateAppointmentResponse> = await response.json()

  if (result.success) {
    console.log('Appointment booked:', result.data.appointment)
    return result.data
  } else {
    throw new Error(result.error)
  }
}
```

### Fetch Vehicles with Filters

```typescript
async function getVehicles(filters: VehicleFilterParams) {
  const params = new URLSearchParams(filters as any)
  const response = await fetch(`/api/vehicles?${params}`)

  const result: ApiResponse<GetVehiclesResponse> = await response.json()

  if (result.success) {
    return result.data.vehicles
  } else {
    throw new Error(result.error)
  }
}

// Usage
const vehicles = await getVehicles({
  make: 'BMW',
  minPrice: '30000',
  maxPrice: '60000',
  page: '1',
  limit: '12'
})
```

---

## Development Notes

### Adding New API Routes

1. **Define types** in `/types/routes.ts`
2. **Create validation schema** in `/lib/validation.ts`
3. **Implement handler** with proper types:
   ```typescript
   export async function POST(
     request: NextRequest
   ): Promise<NextResponse<ApiResponse<YourResponseType>>> {
     const validation = await validateRequest(request, yourSchema)
     if ('error' in validation) return validation.error

     // ... your logic

     return successResponse(data, message)
   }
   ```
4. **Add error handling** with appropriate error codes
5. **Document** in this file

### Testing

```bash
# Type check
npx tsc --noEmit --skipLibCheck

# Run tests
npm test

# API testing with curl
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d @appointment.json
```

---

## Version History

- **v1.0.0** (2025-10-07): Initial comprehensive type safety implementation
  - Added base API types
  - Added route-specific types
  - Added validation schemas
  - Updated all major API routes
  - Created comprehensive documentation

---

**Last Updated**: October 7, 2025
**Maintained By**: AUTO ANI Development Team
