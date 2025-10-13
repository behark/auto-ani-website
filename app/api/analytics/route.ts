import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Only process in production
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: false, message: 'Analytics disabled in development' });
    }

    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid metric data' }, { status: 400 });
    }

    // Log performance metrics for monitoring
    console.info(`[Analytics] ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`, {
      id: metric.id,
      value: metric.value,
      delta: metric.delta,
      entries: metric.entries?.length || 0,
      url: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Here you could send to external analytics services:
    // - Google Analytics 4
    // - PostHog
    // - Mixpanel
    // - Custom analytics backend

    // Example: Send to Google Analytics 4 (gtag)
    if (process.env.GA_MEASUREMENT_ID) {
      // This would typically be done via gtag on the client side
      // Server-side reporting to GA4 would require the Measurement Protocol
    }

    // Example: Send to PostHog
    if (process.env.POSTHOG_KEY) {
      // Would use PostHog SDK here
    }

    // Store in database if needed
    // await storeMetricInDatabase(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error processing metric:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}