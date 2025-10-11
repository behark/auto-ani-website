import { NextRequest, NextResponse } from 'next/server';
import { queryDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerEmail = searchParams.get('customerEmail');
    const isActive = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause = 'TRUE';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (customerEmail) {
      whereClause += ` AND "customerEmail" = $${paramIndex}`;
      queryParams.push(customerEmail);
      paramIndex++;
    }

    if (isActive !== null) {
      whereClause += ` AND "isActive" = $${paramIndex}`;
      queryParams.push(isActive === 'true');
      paramIndex++;
    }

    const query = `
      SELECT *
      FROM inventory_alerts
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);

    const alerts = await queryDatabase(query, queryParams);

    return NextResponse.json({
      success: true,
      alerts,
      total: alerts.length
    });

  } catch (error) {
    console.error('Error fetching inventory alerts:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      alerts: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      vehicleMake,
      vehicleModel,
      maxPrice,
      minYear,
      maxMileage,
      bodyType,
      fuelType,
      isActive = true
    } = body;

    // Validation
    if (!customerEmail || !customerName) {
      return NextResponse.json({
        success: false,
        error: 'Customer email and name are required'
      }, { status: 400 });
    }

    // Check for existing similar alerts
    const existingQuery = `
      SELECT id FROM inventory_alerts
      WHERE "customerEmail" = $1
        AND "vehicleMake" = $2
        AND "vehicleModel" = $3
        AND "maxPrice" = $4
        AND "isActive" = true
      LIMIT 1
    `;

    const existing = await queryDatabase(existingQuery, [
      customerEmail,
      vehicleMake || null,
      vehicleModel || null,
      maxPrice || null
    ]);

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'You already have a similar alert active'
      }, { status: 409 });
    }

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const insertQuery = `
      INSERT INTO inventory_alerts (
        id, "customerEmail", "customerName", "vehicleMake", "vehicleModel",
        "maxPrice", "minYear", "maxMileage", "bodyType", "fuelType",
        "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING id, "customerEmail", "customerName", "vehicleMake", "vehicleModel"
    `;

    const values = [
      alertId,
      customerEmail,
      customerName,
      vehicleMake || null,
      vehicleModel || null,
      maxPrice || null,
      minYear || null,
      maxMileage || null,
      bodyType || null,
      fuelType || null,
      isActive
    ];

    const result = await queryDatabase(insertQuery, values);

    // Check for immediate matches in current inventory
    const matchQuery = `
      SELECT id, make, model, year, price, mileage, "fuelType", "bodyType"
      FROM vehicles
      WHERE status = 'AVAILABLE'
        ${vehicleMake ? `AND LOWER(make) = LOWER('${vehicleMake}')` : ''}
        ${vehicleModel ? `AND LOWER(model) ILIKE LOWER('%${vehicleModel}%')` : ''}
        ${maxPrice ? `AND price <= ${maxPrice}` : ''}
        ${minYear ? `AND year >= ${minYear}` : ''}
        ${maxMileage ? `AND mileage <= ${maxMileage}` : ''}
        ${bodyType ? `AND "bodyType" = '${bodyType}'` : ''}
        ${fuelType ? `AND "fuelType" = '${fuelType}'` : ''}
      LIMIT 5
    `;

    const matches = await queryDatabase(matchQuery, []);

    console.log(`✅ New inventory alert created: ${customerName} (${customerEmail})`);
    if (matches.length > 0) {
      console.log(`📧 ${matches.length} immediate matches found - should send notification`);
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory alert created successfully!',
      alert: result[0],
      immediateMatches: matches.length,
      matches: matches
    });

  } catch (error) {
    console.error('Error creating inventory alert:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create inventory alert'
    }, { status: 500 });
  }
}

// Check alerts and send notifications for new vehicles
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json({
        success: false,
        error: 'Vehicle ID is required'
      }, { status: 400 });
    }

    // Get vehicle details
    const vehicleQuery = `
      SELECT * FROM vehicles WHERE id = $1 AND status = 'AVAILABLE'
    `;
    const vehicles = await queryDatabase(vehicleQuery, [vehicleId]);

    if (vehicles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Vehicle not found'
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // Find matching alerts
    const alertsQuery = `
      SELECT * FROM inventory_alerts
      WHERE "isActive" = true
        AND ("vehicleMake" IS NULL OR LOWER("vehicleMake") = LOWER($1))
        AND ("vehicleModel" IS NULL OR LOWER("vehicleModel") = LOWER($2) OR LOWER($2) ILIKE LOWER(CONCAT('%', "vehicleModel", '%')))
        AND ("maxPrice" IS NULL OR $3 <= "maxPrice")
        AND ("minYear" IS NULL OR $4 >= "minYear")
        AND ("maxMileage" IS NULL OR $5 <= "maxMileage")
        AND ("bodyType" IS NULL OR "bodyType" = $6)
        AND ("fuelType" IS NULL OR "fuelType" = $7)
    `;

    const matchingAlerts = await queryDatabase(alertsQuery, [
      vehicle.make,
      vehicle.model,
      vehicle.price,
      vehicle.year,
      vehicle.mileage,
      vehicle.bodyType,
      vehicle.fuelType
    ]);

    // Record notifications
    const notifications = [];
    for (const alert of matchingAlerts) {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const insertNotificationQuery = `
        INSERT INTO alert_notifications (
          id, "alertId", "vehicleId", method, "sentAt"
        ) VALUES (
          $1, $2, $3, 'email', NOW()
        )
      `;

      await queryDatabase(insertNotificationQuery, [notificationId, alert.id, vehicleId]);

      notifications.push({
        alertId: alert.id,
        customerEmail: alert.customerEmail,
        customerName: alert.customerName,
        vehicle: vehicle
      });

      // Update last notified timestamp
      await queryDatabase(
        `UPDATE inventory_alerts SET "lastNotified" = NOW() WHERE id = $1`,
        [alert.id]
      );
    }

    // TODO: Send actual email notifications
    console.log(`✅ Found ${matchingAlerts.length} matching alerts for vehicle: ${vehicle.make} ${vehicle.model}`);

    return NextResponse.json({
      success: true,
      message: `Found ${matchingAlerts.length} matching alerts`,
      matchingAlerts: matchingAlerts.length,
      notifications: notifications.length
    });

  } catch (error) {
    console.error('Error processing vehicle alerts:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process alerts'
    }, { status: 500 });
  }
}