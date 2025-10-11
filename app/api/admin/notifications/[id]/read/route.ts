import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// PATCH /api/admin/notifications/:id/read - Mark notification as read (SECURED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createAdminHandler(
    async (req: NextRequest, user: AuthenticatedUser) => {
      // Apply rate limiting
      const rateLimitResult = await rateLimiters.api(req);
      if (rateLimitResult && rateLimitResult.status === 429) {
        return rateLimitResult;
      }

      try {
        const { id: notificationId } = await params;

        const setting = await prisma.setting.findUnique({
          where: {
            key: `notification.${notificationId}`,
          },
        });

        if (!setting) {
          return NextResponse.json(
            { success: false, error: 'Notification not found' },
            { status: 404 }
          );
        }

        const notification = JSON.parse(setting.value);
        notification.read = true;

        await prisma.setting.update({
          where: {
            key: `notification.${notificationId}`,
          },
          data: {
            value: JSON.stringify(notification),
          },
        });

        logger.info('Notification marked as read:', {
          notificationId,
          userId: user.id,
          email: user.email,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        logger.error('Error marking notification as read:', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { success: false, error: 'Failed to update notification' },
          { status: 500 }
        );
      }
    },
    {
      requireAdmin: true,
      logAction: 'Mark notification as read',
    }
  )(request);
}