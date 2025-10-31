import { NextRequest, NextResponse } from "next/server";

import { rateLimit } from "@/lib/api-utils";
import { validateVehicleQuery } from "@/lib/validation/vehicle-api";
import { vehicleHelpers } from "@/data/vehicles";

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

    const params = validation.data;
    if (!params) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Get all vehicles from hardcoded data
    let vehicles = vehicleHelpers.getAvailable();

    // Apply filters
    if (params.category && params.category !== 'all') {
      vehicles = vehicles.filter(v => v.category === params.category);
    }

    if (params.featured === 'true') {
      vehicles = vehicles.filter(v => v.featured === true);
    }

    if (params.brand) {
      vehicles = vehicles.filter(v =>
        v.brand.toLowerCase().includes(params.brand.toLowerCase())
      );
    }

    if (params.minPrice !== undefined) {
      vehicles = vehicles.filter(v => v.price >= params.minPrice);
    }

    if (params.maxPrice !== undefined) {
      vehicles = vehicles.filter(v => v.price <= params.maxPrice);
    }

    // Additional filters that might come from the client
    const searchParams = request.nextUrl.searchParams;

    // Fuel type filter
    const fuelType = searchParams.get('fuelType');
    if (fuelType && fuelType !== 'all') {
      vehicles = vehicles.filter(v => v.fuelType === fuelType);
    }

    // Transmission filter
    const transmission = searchParams.get('transmission');
    if (transmission && transmission !== 'all') {
      vehicles = vehicles.filter(v => v.transmission === transmission);
    }

    // Year filters
    const minYear = searchParams.get('minYear');
    if (minYear) {
      vehicles = vehicles.filter(v => v.year >= parseInt(minYear));
    }

    const maxYear = searchParams.get('maxYear');
    if (maxYear) {
      vehicles = vehicles.filter(v => v.year <= parseInt(maxYear));
    }

    // Mileage filters
    const minMileage = searchParams.get('minMileage');
    if (minMileage) {
      vehicles = vehicles.filter(v => v.mileage && v.mileage >= parseInt(minMileage));
    }

    const maxMileage = searchParams.get('maxMileage');
    if (maxMileage) {
      vehicles = vehicles.filter(v => v.mileage && v.mileage <= parseInt(maxMileage));
    }

    // Color filter
    const color = searchParams.get('color');
    if (color && color !== 'all') {
      vehicles = vehicles.filter(v => v.color === color);
    }

    // Condition filter
    const condition = searchParams.get('condition');
    if (condition && condition !== 'all') {
      vehicles = vehicles.filter(v => v.condition === condition);
    }

    // Search query
    const search = searchParams.get('search');
    if (search) {
      vehicles = vehicleHelpers.search(search).filter(v =>
        vehicles.some(filtered => filtered._id === v._id)
      );
    }

    // Sort vehicles
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    switch (sortBy) {
      case 'price_asc':
        vehicles = vehicleHelpers.sort(vehicles, 'price_asc');
        break;
      case 'price_desc':
        vehicles = vehicleHelpers.sort(vehicles, 'price_desc');
        break;
      case 'year_desc':
        vehicles = vehicleHelpers.sort(vehicles, 'year_desc');
        break;
      case 'mileage_asc':
        vehicles = vehicleHelpers.sort(vehicles, 'mileage_asc');
        break;
      case 'date_desc':
      default:
        vehicles = vehicleHelpers.sort(vehicles, 'date_desc');
        break;
    }

    // Apply limit if specified
    if (params.limit && params.limit > 0) {
      vehicles = vehicles.slice(0, params.limit);
    }

    // Get filter options for the client
    const filterOptions = vehicleHelpers.getFilterOptions();

    // Return with cache headers for better performance
    const response = NextResponse.json({
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
          fuelType: fuelType,
          transmission: transmission,
          color: color,
          condition: condition,
          ...(params.limit && { limit: params.limit }),
        },
        filterOptions: {
          brands: filterOptions.brands,
          categories: filterOptions.categories,
          fuelTypes: filterOptions.fuelTypes,
          transmissions: filterOptions.transmissions,
          colors: filterOptions.colors,
          conditions: filterOptions.conditions,
          years: filterOptions.years,
          priceRange: filterOptions.priceRange,
          mileageRange: filterOptions.mileageRange,
        }
      },
    });

    // Set cache headers - can be more aggressive with static data
    // public: Allow caching by CDNs and browsers
    // s-maxage=3600: Cache on CDN for 1 hour (static data doesn't change often)
    // stale-while-revalidate=7200: Serve stale content while fetching new data for up to 2 hours
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    );

    return response;
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
        error: "Failed to fetch vehicles",
        ...(isProduction ? {} : { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for getting vehicles with complex filters
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 50,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Use the filter helper with complex filters
    let vehicles = vehicleHelpers.filter({
      brand: body.brand,
      model: body.model,
      minYear: body.minYear,
      maxYear: body.maxYear,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      fuelType: body.fuelType,
      transmission: body.transmission,
      category: body.category,
      minMileage: body.minMileage,
      maxMileage: body.maxMileage,
      condition: body.condition,
      features: body.features,
    });

    // Filter out sold vehicles unless explicitly requested
    if (!body.includeSold) {
      vehicles = vehicles.filter(v => v.status !== 'sold');
    }

    // Apply sorting
    if (body.sortBy) {
      vehicles = vehicleHelpers.sort(vehicles, body.sortBy);
    }

    // Apply pagination
    const page = body.page || 1;
    const pageSize = body.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        vehicles: paginatedVehicles,
        total: vehicles.length,
        page,
        pageSize,
        totalPages: Math.ceil(vehicles.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to filter vehicles:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to filter vehicles",
      },
      { status: 500 }
    );
  }
}