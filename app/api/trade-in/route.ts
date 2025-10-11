import { NextRequest, NextResponse } from 'next/server';
import { queryDatabase } from '@/lib/postgres';
import { errorResponse, successResponse, ApiResponse } from '@/types/api';
import { GetTradeInValuationsResponse, CreateTradeInResponse, CreateTradeInRequest, VehicleCondition } from '@/types/routes';

// Simple valuation algorithm - would be more sophisticated in production
function calculateMarketValue(data: CreateTradeInRequest) {
  let baseValue = 20000; // Base value

  // Adjust by make
  const premiumMakes = ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Volvo'];
  const luxuryMakes = ['Porsche', 'Jaguar', 'Land Rover'];

  if (luxuryMakes.includes(data.vehicleMake)) {
    baseValue *= 1.8;
  } else if (premiumMakes.includes(data.vehicleMake)) {
    baseValue *= 1.3;
  }

  // Adjust by age
  const age = new Date().getFullYear() - data.vehicleYear;
  const depreciation = Math.pow(0.85, age); // 15% per year
  baseValue *= depreciation;

  // Adjust by mileage (above/below average)
  const averageKmPerYear = 15000;
  const expectedKm = age * averageKmPerYear;
  const mileageFactor = expectedKm / data.vehicleMileage;
  baseValue *= Math.min(1.2, Math.max(0.7, mileageFactor));

  // Adjust by condition
  const conditionMultipliers = {
    excellent: 1.1,
    very_good: 1.0,
    good: 0.85,
    fair: 0.65,
    poor: 0.4
  };
  baseValue *= conditionMultipliers[data.vehicleCondition as keyof typeof conditionMultipliers] || 0.85;

  // Adjust by accidents and service history
  if (data.hasAccidents) baseValue *= 0.75;
  if (!data.hasServiceHistory) baseValue *= 0.85;

  return Math.round(baseValue);
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GetTradeInValuationsResponse>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause = 'TRUE';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const query = `
      SELECT *
      FROM trade_in_valuations
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);

    const valuations = await queryDatabase(query, queryParams);

    return successResponse({
      valuations,
      total: valuations.length
    });

  } catch (error) {
    console.error('Error fetching trade-in valuations:', error);

    return errorResponse(
      'Failed to fetch trade-in valuations',
      500,
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreateTradeInResponse>>> {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleMileage,
      vehicleCondition,
      hasAccidents,
      hasServiceHistory,
      vehiclePhotos = [],
      additionalInfo
    } = body;

    // Validation
    const requiredFields = {
      customerName,
      customerEmail,
      customerPhone,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleMileage,
      vehicleCondition
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    // Calculate market value and offer value
    const marketValue = calculateMarketValue(body);
    const offerValue = Math.round(marketValue * 0.85); // 85% of market value as initial offer

    const valuationId = `tradein_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const insertQuery = `
      INSERT INTO trade_in_valuations (
        id, "customerName", "customerEmail", "customerPhone", "vehicleMake", "vehicleModel",
        "vehicleYear", "vehicleMileage", "vehicleCondition", "vehiclePhotos",
        "hasAccidents", "hasServiceHistory", "marketValue", "offerValue",
        status, notes, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'SUBMITTED', $15, NOW(), NOW()
      ) RETURNING id, "customerName", "marketValue", "offerValue", status
    `;

    const values = [
      valuationId,
      customerName,
      customerEmail,
      customerPhone,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleMileage,
      vehicleCondition,
      JSON.stringify(vehiclePhotos),
      hasAccidents || false,
      hasServiceHistory || false,
      marketValue,
      offerValue,
      additionalInfo || null
    ];

    const result = await queryDatabase(insertQuery, values);

    // TODO: Send notification to sales team
    // TODO: Send confirmation email to customer
    // TODO: Schedule follow-up

    console.log(`✅ New trade-in valuation: ${customerName} - ${vehicleMake} ${vehicleModel} (${vehicleYear})`);

    return successResponse(
      {
        valuation: result[0],
        estimatedValue: offerValue,
        marketValue: marketValue,
        message: 'Trade-in valuation submitted successfully!'
      },
      'Trade-in valuation submitted successfully!'
    );

  } catch (error) {
    console.error('Error creating trade-in valuation:', error);

    return errorResponse(
      'Failed to submit trade-in valuation',
      500,
      'SUBMISSION_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}