import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ApiResponse, createPaginationMeta } from '@/types/api';
import { GetVehiclesResponse, Vehicle } from '@/types/routes';

const prisma = new PrismaClient();

// Prisma-based vehicles API with SQLite support
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GetVehiclesResponse>>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const featured = searchParams.get('featured') === 'true';
    const sortBy = searchParams.get('sortBy') || 'featured DESC, createdAt DESC';

    // Build Prisma where clause
    const whereClause: any = {
      status: 'AVAILABLE'
    };

    if (featured) {
      whereClause.featured = true;
    }

    // Add other filters
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const bodyType = searchParams.get('bodyType');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');

    if (make) {
      whereClause.make = {
        contains: make,
        mode: 'insensitive'
      };
    }

    if (model) {
      whereClause.model = {
        contains: model,
        mode: 'insensitive'
      };
    }

    if (bodyType) {
      whereClause.bodyType = {
        contains: bodyType,
        mode: 'insensitive'
      };
    }

    if (fuelType) {
      whereClause.fuelType = {
        contains: fuelType,
        mode: 'insensitive'
      };
    }

    if (transmission) {
      whereClause.transmission = {
        contains: transmission,
        mode: 'insensitive'
      };
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseInt(minPrice);
      if (maxPrice) whereClause.price.lte = parseInt(maxPrice);
    }

    if (minYear || maxYear) {
      whereClause.year = {};
      if (minYear) whereClause.year.gte = parseInt(minYear);
      if (maxYear) whereClause.year.lte = parseInt(maxYear);
    }

    // Parse sortBy parameter for Prisma orderBy
    const orderBy: any[] = [];
    if (sortBy.includes('featured DESC')) {
      orderBy.push({ featured: 'desc' });
    }
    if (sortBy.includes('createdAt DESC')) {
      orderBy.push({ createdAt: 'desc' });
    }
    if (sortBy.includes('price')) {
      orderBy.push({ price: sortBy.includes('price DESC') ? 'desc' : 'asc' });
    }
    if (sortBy.includes('year')) {
      orderBy.push({ year: sortBy.includes('year DESC') ? 'desc' : 'asc' });
    }
    if (orderBy.length === 0) {
      orderBy.push({ featured: 'desc' }, { createdAt: 'desc' });
    }

    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Get vehicles with filters and pagination using Prisma
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: whereClause,
        orderBy: orderBy,
        take: limit,
        skip: skip,
        select: {
          id: true,
          slug: true,
          make: true,
          model: true,
          year: true,
          price: true,
          mileage: true,
          fuelType: true,
          transmission: true,
          bodyType: true,
          color: true,
          engineSize: true,
          drivetrain: true,
          features: true,
          images: true,
          description: true,
          featured: true,
          status: true,
          vin: true,
          doors: true,
          seats: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.vehicle.count({
        where: whereClause
      })
    ]);

    console.log(`✅ Fetched ${vehicles.length} vehicles via Prisma SQLite (total: ${total})`);

    // Create properly typed response
    const pagination = createPaginationMeta(total, page, limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          vehicles: vehicles as Vehicle[],
          total,
          pagination
        }
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=30, stale-while-revalidate=60`,
          'X-Database-Method': 'prisma-sqlite'
        },
      }
    );

  } catch (error) {
    console.error('❌ Prisma vehicles API error:', error);

    return errorResponse(
      'Failed to fetch vehicles',
      500,
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}