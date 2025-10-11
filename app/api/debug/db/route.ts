import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('=== DATABASE DEBUG ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_PROVIDER:', process.env.DATABASE_PROVIDER);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');

    // Test basic connection
    console.log('Testing database connection...');
    const testQuery = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    console.log('Connection test result:', testQuery);

    // Count vehicles
    console.log('Counting vehicles...');
    const vehicleCount = await prisma.vehicle.count();
    console.log('Vehicle count:', vehicleCount);

    // Get first few vehicles
    const vehicles = await prisma.vehicle.findMany({
      take: 3,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        status: true
      }
    });
    console.log('Sample vehicles:', vehicles);

    return NextResponse.json({
      status: 'success',
      database: {
        connected: true,
        provider: process.env.DATABASE_PROVIDER,
        vehicleCount,
        sampleVehicles: vehicles,
        testQuery
      }
    });
  } catch (error) {
    console.error('=== DATABASE ERROR ===');
    console.error('Error details:', error);

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}