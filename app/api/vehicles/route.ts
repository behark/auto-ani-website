import { NextRequest, NextResponse } from "next/server";
import { validateVehicleQuery } from "@/lib/validation/vehicle-api";
import { rateLimit } from "@/lib/api-utils";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    // Validate and sanitize input parameters
    const validation = validateVehicleQuery(request.nextUrl.searchParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const params = validation.data!;

    // Dynamic import to avoid build-time issues
    const { client } = await import("@/lib/sanity");

    // Build GROQ query with validated and sanitized filters
    const filters = ['_type == "vehicle"'];
    if (params.category && params.category !== 'all') {
      filters.push(`category == "${params.category}"`);
    }
    if (params.featured === 'true') {
      filters.push(`featured == true`);
    }
    if (params.brand) {
      // Brand is already sanitized by validation
      filters.push(`brand match "${params.brand}*"`);
    }
    if (params.minPrice !== undefined) {
      filters.push(`price >= ${params.minPrice}`);
    }
    if (params.maxPrice !== undefined) {
      filters.push(`price <= ${params.maxPrice}`);
    }

    // ✅ OPTIMIZED: Only fetch mainImage (first image), not entire gallery
    // ✅ NO DEFAULT LIMIT - Fetch all vehicles unless limit is explicitly provided
    let query = `*[${filters.join(" && ")}] {
      _id,
      _type,
      title,
      slug,
      brand,
      model,
      year,
      price,
      mileage,
      category,
      featured,
      description,
      fuelType,
      transmission,
      color,
      engine,
      "mainImage": mainImage.asset->url,
      _createdAt,
      _updatedAt
    } | order(_createdAt desc)`;

    // Only apply limit if explicitly provided and validated
    if (params.limit && params.limit > 0) {
      query += `[0...${params.limit}]`;
    }

    const vehicles = await client.fetch(query);

    return NextResponse.json({
      success: true,
      data: {
        vehicles,
        total: vehicles.length,
        filters: {
          category: params.category,
          featured: params.featured === 'true',
          brand: params.brand,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          ...(params.limit && { limit: params.limit }),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction
      ? "Failed to fetch vehicles"
      : (error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch vehicles from database",
        ...(isProduction ? {} : { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}
