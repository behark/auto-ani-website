import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time issues
    const { client } = await import("@/lib/sanity");

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Optional limit parameter - if provided, use it, otherwise fetch all
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : null;

    // Build GROQ query with filters
    const filters = ['_type == "vehicle"'];
    if (category) filters.push(`category == "${category}"`);
    if (featured) filters.push(`featured == true`);
    if (brand) filters.push(`brand match "${brand}*"`);
    if (minPrice) filters.push(`price >= ${minPrice}`);
    if (maxPrice) filters.push(`price <= ${maxPrice}`);

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

    // Only apply limit if explicitly provided in query params
    if (limit && limit > 0) {
      query += `[0...${limit}]`;
    }

    const vehicles = await client.fetch(query);

    return NextResponse.json({
      success: true,
      data: {
        vehicles,
        total: vehicles.length,
        filters: {
          category,
          featured,
          brand,
          minPrice,
          maxPrice,
          ...(limit && { limit }),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch vehicles from Sanity CMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
