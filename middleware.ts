import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Create response
  const response = NextResponse.next();

  // Enhanced security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY', // Changed to DENY for better security
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()',
    'X-DNS-Prefetch-Control': 'on',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add HSTS for production with preload
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Improved CSP - still needs unsafe-inline for Next.js but more restrictive
  const isProduction = process.env.NODE_ENV === 'production';
  const cspDirectives = [
    "default-src 'self'",
    // Script sources - add specific domains only
    isProduction
      ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow eval in dev for hot reload
    // Style sources
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Image sources - restrict to specific CDNs
    "img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io",
    // Font sources
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connect sources - specific APIs only
    "connect-src 'self' https://*.sanity.io https://www.google-analytics.com https://*.sentry.io wss://*.sanity.io",
    // Frame sources - remove if not needed
    "frame-src 'none'",
    // Object sources
    "object-src 'none'",
    // Base URI
    "base-uri 'self'",
    // Form action
    "form-action 'self'",
    // Upgrade insecure requests in production
    isProduction ? "upgrade-insecure-requests" : "",
  ].filter(Boolean);

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[${request.method}] ${path}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - api routes (let them handle their own security)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml|api).*)',
  ],
};