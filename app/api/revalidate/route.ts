import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { constantTimeCompare } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify secret token with timing-safe comparison
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.REVALIDATE_SECRET;

    // Security check: ensure both values exist and match using constant-time comparison
    if (!secret || !expectedSecret || !constantTimeCompare(secret, expectedSecret)) {
      logger.warn('Revalidation attempt with invalid token');
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const body = await request.json();
    logger.info('Revalidation triggered:', body);

    // Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/vehicles');
    revalidatePath('/inventory');
    
    // If you're using tags, revalidate them
    revalidateTag('vehicles');

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      message: 'Successfully revalidated'
    });

  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) }, 
      { status: 500 }
    );
  }
}

// Handle GET requests to test the endpoint
export function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Revalidation endpoint active. Use POST with secret token.'
  });
}
