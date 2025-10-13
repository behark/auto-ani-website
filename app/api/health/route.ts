import { NextResponse } from "next/server";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

export async function GET() {
  const requestStart = Date.now();

  try {
    // Dynamic import to avoid build-time issues
    const { client } = await import("@/lib/sanity");

    // Test Sanity connection with timeout
    const sanityStart = Date.now();
    const sanityTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Sanity connection timeout")), 5000)
    );

    const sanityTest = client.fetch('*[_type == "vehicle"][0]._id');

    await Promise.race([sanityTest, sanityTimeout]);
    const sanityLatency = Date.now() - sanityStart;

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        sanity: {
          status: "connected",
          latency: `${sanityLatency}ms`,
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        },
      },
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      version: "1.0.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: "Service unavailable",
        services: {
          sanity: {
            status: "disconnected",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        environment: process.env.NODE_ENV || "development",
      },
      { status: 503 }
    );
  }
}
