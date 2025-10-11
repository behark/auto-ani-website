import { NextRequest, NextResponse } from 'next/server';
import { queryDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const approved = searchParams.get('approved') === 'true';
    const vehicleId = searchParams.get('vehicleId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause = 'TRUE';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (approved) {
      whereClause += ` AND "isApproved" = true AND "isPublic" = true`;
    }

    if (vehicleId) {
      whereClause += ` AND "vehicleId" = $${paramIndex}`;
      queryParams.push(vehicleId);
      paramIndex++;
    }

    const query = `
      SELECT
        t.*,
        v.make as "vehicleMake",
        v.model as "vehicleModel",
        v.year as "vehicleYear"
      FROM testimonials t
      LEFT JOIN vehicles v ON t."vehicleId" = v.id
      WHERE ${whereClause}
      ORDER BY t.rating DESC, t."createdAt" DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);

    const testimonials = await queryDatabase(query, queryParams);

    // Parse JSON fields
    const formattedTestimonials = testimonials.map((t: any) => ({
      ...t,
      photos: t.photos ? JSON.parse(t.photos) : []
    }));

    return NextResponse.json({
      success: true,
      testimonials: formattedTestimonials,
      total: testimonials.length
    });

  } catch (error) {
    console.error('Error fetching testimonials:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testimonials: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      customerName,
      customerEmail,
      rating,
      title,
      content,
      photos = [],
      location
    } = body;

    // Validation
    if (!customerName || !content || !rating) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customerName, content, rating'
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    const testimonialId = `testimonial_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const insertQuery = `
      INSERT INTO testimonials (
        id, "vehicleId", "customerName", "customerEmail", rating, title, content,
        photos, location, "isVerified", "isApproved", "isPublic", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, true, NOW(), NOW()
      ) RETURNING id, "customerName", rating, title
    `;

    const values = [
      testimonialId,
      vehicleId || null,
      customerName,
      customerEmail || null,
      rating,
      title || null,
      content,
      JSON.stringify(photos),
      location || null
    ];

    const result = await queryDatabase(insertQuery, values);

    // TODO: Send notification to admin about new testimonial for approval

    return NextResponse.json({
      success: true,
      message: 'Testimonial submitted successfully! It will be reviewed before publishing.',
      testimonial: result[0]
    });

  } catch (error) {
    console.error('Error creating testimonial:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit testimonial'
    }, { status: 500 });
  }
}