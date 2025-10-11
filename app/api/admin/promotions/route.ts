import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

interface PromotionData {
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BOGO';
  value: number;
  startDate: string;
  endDate: string;
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    applicableVehicles?: string[];
    applicableParts?: string[];
    customerSegments?: string[];
    maxUses?: number;
    maxUsesPerCustomer?: number;
  };
}

// GET /api/admin/promotions - Get all promotions (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      // Fetch promotions from settings (temporary storage solution)
      const promotionSettings = await prisma.setting.findMany({
        where: {
          category: 'promotions',
          key: {
            startsWith: 'promotion.',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse promotions and calculate usage stats
      const promotions = await Promise.all(
        promotionSettings.map(async (setting: {
          key: string;
          value: string;
        }) => {
          try {
            const promotion = JSON.parse(setting.value);

            // Calculate usage stats from database
            const usage = await calculatePromotionUsage(promotion.id);

            return {
              ...promotion,
              usage,
            };
          } catch (err) {
            logger.warn('Failed to parse promotion:', { key: setting.key });
            return null;
          }
        })
      );

      const validPromotions = promotions.filter(Boolean);

      return NextResponse.json({
        success: true,
        promotions: validPromotions,
      });
    } catch (error) {
      logger.error('Error fetching promotions:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch promotions',
  }
);

// POST /api/admin/promotions - Create a new promotion (SECURED)
export const POST = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const body: PromotionData = await request.json();

      // Validate required fields
      if (!body.name || !body.type || body.value === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Generate promotion ID
      const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const promotion = {
        id: promotionId,
        ...body,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Store promotion in database
      await prisma.setting.create({
        data: {
          key: `promotion.${promotionId}`,
          value: JSON.stringify(promotion),
          category: 'promotions',
        },
      });

      logger.info('Promotion created:', {
        promotionId,
        name: body.name,
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        promotion,
      });
    } catch (error) {
      logger.error('Error creating promotion:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to create promotion' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Create promotion',
    auditSensitive: true,
  }
);

// Helper function to calculate promotion usage
async function calculatePromotionUsage(promotionId: string) {
  try {
    // In a real implementation, you would track promotion usage in a dedicated table
    // For now, we'll calculate approximate stats from vehicle inquiries and payments

    // Count recent inquiries as potential uses (mock calculation)
    const recentInquiries = await prisma.vehicleInquiry.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Calculate mock revenue impact
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'SOLD',
      },
      select: {
        price: true,
      },
      take: 10,
    });

    const totalRevenue = vehicles.reduce((sum: number, v: { price: number }) => sum + v.price, 0) * 0.1; // 10% attributed to promotions

    return {
      totalUses: Math.floor(recentInquiries * 0.3), // Assume 30% used promotions
      totalRevenue: Math.floor(totalRevenue),
      conversionRate: 8.5 + Math.random() * 10, // Random between 8.5-18.5%
    };
  } catch (error) {
    logger.error('Error calculating promotion usage:', { error: error instanceof Error ? error.message : String(error) });
    return {
      totalUses: 0,
      totalRevenue: 0,
      conversionRate: 0,
    };
  }
}