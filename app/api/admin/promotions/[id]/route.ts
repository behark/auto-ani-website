import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// PUT /api/admin/promotions/:id - Update a promotion (SECURED)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return createAdminHandler(
    async (req: NextRequest, user: AuthenticatedUser) => {
      // Apply rate limiting
      const rateLimitResult = await rateLimiters.api(req);
      if (rateLimitResult && rateLimitResult.status === 429) {
        return rateLimitResult;
      }

      try {
        const { id: promotionId } = await context.params;
        const body = await req.json();

        const setting = await prisma.setting.findUnique({
          where: {
            key: `promotion.${promotionId}`,
          },
        });

        if (!setting) {
          return NextResponse.json(
            { success: false, error: 'Promotion not found' },
            { status: 404 }
          );
        }

        const existingPromotion = JSON.parse(setting.value);
        const updatedPromotion = {
          ...existingPromotion,
          ...body,
          id: promotionId, // Preserve ID
          updatedAt: new Date().toISOString(),
        };

        await prisma.setting.update({
          where: {
            key: `promotion.${promotionId}`,
          },
          data: {
            value: JSON.stringify(updatedPromotion),
          },
        });

        logger.info('Promotion updated:', {
          promotionId,
          userId: user.id,
          email: user.email,
        });

        return NextResponse.json({
          success: true,
          promotion: updatedPromotion,
        });
      } catch (error) {
        logger.error('Error updating promotion:', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { success: false, error: 'Failed to update promotion' },
          { status: 500 }
        );
      }
    },
    {
      requireAdmin: true,
      logAction: 'Update promotion',
      auditSensitive: true,
    }
  )(request);
}

// PATCH /api/admin/promotions/:id - Toggle promotion status (SECURED)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return createAdminHandler(
    async (req: NextRequest, user: AuthenticatedUser) => {
      // Apply rate limiting
      const rateLimitResult = await rateLimiters.api(req);
      if (rateLimitResult && rateLimitResult.status === 429) {
        return rateLimitResult;
      }

      try {
        const { id: promotionId } = await context.params;
        const body = await req.json();
        const { isActive } = body;

        if (isActive === undefined) {
          return NextResponse.json(
            { success: false, error: 'isActive field required' },
            { status: 400 }
          );
        }

        const setting = await prisma.setting.findUnique({
          where: {
            key: `promotion.${promotionId}`,
          },
        });

        if (!setting) {
          return NextResponse.json(
            { success: false, error: 'Promotion not found' },
            { status: 404 }
          );
        }

        const promotion = JSON.parse(setting.value);
        promotion.isActive = isActive;
        promotion.updatedAt = new Date().toISOString();

        await prisma.setting.update({
          where: {
            key: `promotion.${promotionId}`,
          },
          data: {
            value: JSON.stringify(promotion),
          },
        });

        logger.info('Promotion status updated:', {
          promotionId,
          isActive,
          userId: user.id,
          email: user.email,
        });

        return NextResponse.json({
          success: true,
          promotion,
        });
      } catch (error) {
        logger.error('Error updating promotion status:', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { success: false, error: 'Failed to update promotion status' },
          { status: 500 }
        );
      }
    },
    {
      requireAdmin: true,
      logAction: 'Toggle promotion status',
      auditSensitive: true,
    }
  )(request);
}

// DELETE /api/admin/promotions/:id - Delete a promotion (SECURED)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return createAdminHandler(
    async (req: NextRequest, user: AuthenticatedUser) => {
      // Apply rate limiting
      const rateLimitResult = await rateLimiters.api(req);
      if (rateLimitResult && rateLimitResult.status === 429) {
        return rateLimitResult;
      }

      try {
        const { id: promotionId } = await context.params;

        const deleted = await prisma.setting.delete({
          where: {
            key: `promotion.${promotionId}`,
          },
        });

        if (!deleted) {
          return NextResponse.json(
            { success: false, error: 'Promotion not found' },
            { status: 404 }
          );
        }

        logger.info('Promotion deleted:', {
          promotionId,
          userId: user.id,
          email: user.email,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        logger.error('Error deleting promotion:', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { success: false, error: 'Failed to delete promotion' },
          { status: 500 }
        );
      }
    },
    {
      requireAdmin: true,
      logAction: 'Delete promotion',
      auditSensitive: true,
    }
  )(request);
}