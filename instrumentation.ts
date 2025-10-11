/**
 * Next.js Instrumentation Hook
 *
 * This file runs before the application starts and allows us to:
 * - Validate environment variables
 * - Run startup checks
 * - Initialize monitoring and observability
 *
 * Only runs in Node.js runtime (not Edge or browser)
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (server-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and run startup checks
    const { runStartupChecks } = await import('./lib/startup-checks')

    try {
      await runStartupChecks()
      console.log('✅ Application instrumentation complete')
    } catch (error) {
      console.error('❌ Application instrumentation failed:', error)

      // In production, we want to fail fast if startup checks fail
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: Startup checks failed in production. Exiting...')
        process.exit(1)
      } else {
        // In development, log the error but continue
        console.warn('⚠️  Startup checks failed in development. Continuing anyway...')
      }
    }
  }
}

/**
 * Optional: Register OpenTelemetry instrumentation
 * Uncomment if you want to enable OpenTelemetry tracing
 */
// export async function onRequestError(
//   err: Error,
//   request: Request,
//   context: {
//     routerKind: 'Pages Router' | 'App Router'
//     routePath: string
//     routeType: 'render' | 'route' | 'action' | 'middleware'
//   }
// ) {
//   // Log errors to monitoring service
//   const { logger } = await import('./lib/logger')
//   logger.apiError('Request error', err, {
//     url: request.url,
//     method: request.method,
//     ...context,
//   })
// }
