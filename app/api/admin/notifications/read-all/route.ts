import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// POST /api/admin/notifications/read-all - Mark all notifications as read (SECURED)
export const POST = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const notificationSettings = await prisma.setting.findMany({
        where: {
          category: 'notifications',
          key: {
            startsWith: 'notification.',
          },
        },
      });

      // Update all notifications to mark as read
      const updatePromises = notificationSettings.map((setting: any) => {
        try {
          const notification = JSON.parse(setting.value);
          notification.read = true;

          return prisma.setting.update({
            where: { id: setting.id },
            data: {
              value: JSON.stringify(notification),
            },
          });
        } catch (err) {
          logger.warn('Failed to parse notification:', { key: setting.key });
          return null;
        }
      }).filter(Boolean);

      await Promise.all(updatePromises);

      logger.info(`Marked ${updatePromises.length} notifications as read`, {
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        count: updatePromises.length,
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to update notifications' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Mark all notifications as read',
  }
);