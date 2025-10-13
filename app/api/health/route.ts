import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET() {
  const requestStart = Date.now()

  try {
    // Test Sanity connection
    const sanityStart = Date.now()
    await client.fetch('*[_type == "vehicle"][0]._id')
    const sanityLatency = Date.now() - sanityStart

    const responseTime = Date.now() - requestStart

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        sanity: {
          status: 'connected',
          latency: `${sanityLatency}ms`
        }
      },
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      services: {
        sanity: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, { status: 503 })
  }
}