import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time issues
    const { client } = await import("@/lib/sanity");

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Build GROQ query with filters
    const filters = ['_type == "vehicle"'];
    if (category) filters.push(`category == "${category}"`);
    if (featured) filters.push(`featured == true`);
    if (brand) filters.push(`brand match "${brand}*"`);
    if (minPrice) filters.push(`price >= ${minPrice}`);
    if (maxPrice) filters.push(`price <= ${maxPrice}`);

    // Construct the complete query
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
      specifications,
      images[]{
        asset->{
          _id,
          url
        },
        alt
      },
      _createdAt,
      _updatedAt
    } | order(_createdAt desc)`;

    if (limit > 0) {
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
          limit,
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
