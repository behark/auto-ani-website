import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { errorResponse, ApiResponse } from '@/types/api';
import { GetVehicleByIdResponse, Vehicle, UpdateVehicleRequest } from '@/types/routes';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<GetVehicleByIdResponse>>> {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Vehicle ID is required', 400, 'MISSING_ID');
    }

    // Query by ID or slug using Prisma
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        AND: [
          {
            OR: [
              { id: id },
              { slug: id }
            ]
          },
          { status: 'AVAILABLE' }
        ]
      },
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
    });

    if (!vehicle) {
      return errorResponse('Vehicle not found', 404, 'NOT_FOUND');
    }

    // Fetch similar vehicles (same make or body type)
    const similarVehicles = await prisma.vehicle.findMany({
      where: {
        AND: [
          { id: { not: vehicle.id } },
          { status: 'AVAILABLE' },
          {
            OR: [
              { make: vehicle.make },
              { bodyType: vehicle.bodyType }
            ]
          }
        ]
      },
      select: {
        id: true,
        slug: true,
        make: true,
        model: true,
        year: true,
        price: true,
        mileage: true,
        images: true,
        featured: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 4
    });

    console.log(`✅ Found vehicle via Prisma: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);

    return NextResponse.json({
      success: true,
      data: {
        vehicle: vehicle as Vehicle,
        similarVehicles
      }
    });

  } catch (error) {
    console.error('❌ Prisma error fetching vehicle:', error);

    return errorResponse(
      'Failed to fetch vehicle',
      500,
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ id: string; updates: UpdateVehicleRequest }>>> {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Vehicle ID is required', 400, 'MISSING_ID');
    }

    const body = await request.json() as UpdateVehicleRequest;

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingVehicle) {
      return errorResponse('Vehicle not found', 404, 'NOT_FOUND');
    }

    // Prepare update data with proper typing
    const updateData: any = { ...body };

    // Handle features field - convert array to JSON string if needed
    if (body.features && Array.isArray(body.features)) {
      updateData.features = JSON.stringify(body.features);
    }

    // Remove id field if present to avoid conflicts
    delete updateData.id;

    // Update the vehicle using Prisma
    await prisma.vehicle.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    logger.info('Vehicle updated via Prisma', {
      id,
      updates: Object.keys(body)
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        updates: body
      },
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    logger.error('Prisma error updating vehicle:', { error: error instanceof Error ? error.message : String(error) });

    return errorResponse(
      'Failed to update vehicle',
      500,
      'UPDATE_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}