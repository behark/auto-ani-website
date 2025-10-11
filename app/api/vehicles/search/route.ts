import { NextRequest, NextResponse } from 'next/server';
import { VehicleRepository } from '@/lib/database';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get all search parameters
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const bodyType = searchParams.get('bodyType');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const minMileage = searchParams.get('minMileage');
    const maxMileage = searchParams.get('maxMileage');
    const color = searchParams.get('color');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    // Build filters object
    const filters: any = {};

    // Text search across make, model, description
    if (query) {
      filters.query = query;
    }

    // Individual field filters
    if (make) filters.make = make;
    if (model) filters.model = model;
    if (bodyType) filters.bodyType = bodyType;
    if (fuelType) filters.fuelType = fuelType;
    if (transmission) filters.transmission = transmission;
    if (color) filters.color = color;
    if (status) filters.status = status.split(','); // Support multiple statuses
    if (featured !== null && featured !== undefined) {
      filters.featured = featured === 'true';
    }

    // Range filters
    if (minPrice) filters.minPrice = parseInt(minPrice, 10);
    if (maxPrice) filters.maxPrice = parseInt(maxPrice, 10);
    if (minYear) filters.minYear = parseInt(minYear, 10);
    if (maxYear) filters.maxYear = parseInt(maxYear, 10);
    if (minMileage) filters.minMileage = parseInt(minMileage, 10);
    if (maxMileage) filters.maxMileage = parseInt(maxMileage, 10);

    // Execute search with filters
    const result = await VehicleRepository.findMany({
      page,
      limit,
      sortBy,
      filters
    });

    logger.info('Vehicle search executed', {
      query,
      filtersApplied: Object.keys(filters).length,
      totalResults: result.pagination.total,
      page,
      limit
    });

    // Return search results with metadata
    return NextResponse.json({
      vehicles: result.vehicles,
      pagination: result.pagination,
      filters: {
        applied: filters,
        available: {
          makes: [], // Could be populated with distinct values from DB
          bodyTypes: [],
          fuelTypes: [],
          transmissions: [],
          colors: []
        }
      },
      query,
      total: result.pagination.total
    });

  } catch (error) {
    logger.error('Error in vehicle search:', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        vehicles: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    );
  }
}