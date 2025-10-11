import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { errorResponse, successResponse, ApiResponse } from '@/types/api';
import { ContactFormResponse, ContactFormRequest } from '@/types/routes';
import { contactFormSchema, validateRequest, sanitizeTextInput, sanitizeEmail, sanitizePhone } from '@/lib/validation';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

// POST handler - Submit contact form
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ContactFormResponse>>> {
  try {
    // Get client IP for rate limiting (simplified)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limiting
    if (!checkRateLimit(ip)) {
      logger.warn('Rate limit exceeded for contact form submission', { ip, userAgent });
      return errorResponse('Too many requests. Please try again later.', 429, 'RATE_LIMIT');
    }

    // Validate request body
    const validation = await validateRequest(request, contactFormSchema);

    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    // Additional security checks
    // Form submission timing check removed to work with our validation

    // Honeypot check
    if (data.honeypot && data.honeypot.length > 0) {
      logger.warn('Contact form honeypot triggered - bot detected', { ip, userAgent });
      // Don't reveal that we detected a bot - return success
      return successResponse({ message: 'Success', submissionId: 'honeypot' });
    }

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeTextInput(data.name),
      email: sanitizeEmail(data.email),
      phone: data.phone ? sanitizePhone(data.phone) : null,
      message: sanitizeTextInput(data.message),
      vehicleId: data.vehicleId || null,
    };

    // Verify vehicle exists if vehicleId is provided
    if (sanitizedData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: sanitizedData.vehicleId },
        select: { id: true, make: true, model: true, year: true },
      });

      if (!vehicle) {
        return errorResponse('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
      }
    }

    // Create contact submission record using existing Contact model
    const contactSubmission = await prisma.contact.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        message: sanitizedData.message,
        subject: sanitizedData.vehicleId ? `Vehicle Inquiry - ID: ${sanitizedData.vehicleId}` : 'General Inquiry',
        clientIP: ip,
        userAgent: userAgent,
        status: 'NEW',
      },
    });

    // If there's a vehicle inquiry, create a separate VehicleInquiry record
    if (sanitizedData.vehicleId) {
      await prisma.vehicleInquiry.create({
        data: {
          vehicleId: sanitizedData.vehicleId,
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone || '',
          message: sanitizedData.message,
          inquiryType: 'CONTACT_FORM',
          clientIP: ip,
          status: 'NEW',
        },
      });
    }

    // Log successful submission
    logger.info('Contact form submitted successfully', {
      submissionId: contactSubmission.id,
      hasVehicle: !!sanitizedData.vehicleId,
      hasPhone: !!sanitizedData.phone,
      ip,
    });

    // TODO: Send email notification to admin
    // TODO: Send auto-reply to customer
    // TODO: Integration with CRM system
    // TODO: Send to WhatsApp Business API if phone provided

    return successResponse(
      {
        message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
        submissionId: contactSubmission.id
      },
      'Contact form submitted successfully'
    );

  } catch (error) {
    logger.error('Error processing contact form submission:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      'An error occurred while processing your request. Please try again or contact us directly.',
      500,
      'SUBMISSION_ERROR'
    );
  }
}

// GET handler - Health check for contact form
export async function GET(): Promise<NextResponse<ApiResponse<{ status: string; timestamp: string }>>> {
  try {
    // Simple health check - verify database connection
    await prisma.$queryRaw`SELECT 1`;

    return successResponse({
      status: 'Contact form API is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Contact form API health check failed:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return errorResponse('Contact form API is not operational', 503, 'HEALTH_CHECK_FAILED');
  }
}