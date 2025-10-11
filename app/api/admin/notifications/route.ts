import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'inquiry' | 'vehicle' | 'sale' | 'system' | 'appointment';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Store notifications in database using the Setting table with JSON
// In production, you might want a dedicated Notification table
async function createNotification(data: NotificationData) {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const notification = {
    id: notificationId,
    ...data,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // Store in database
  await prisma.setting.create({
    data: {
      key: `notification.${notificationId}`,
      value: JSON.stringify(notification),
      category: 'notifications',
    },
  });

  return notification;
}

// GET /api/admin/notifications - Get recent notifications (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const unreadOnly = searchParams.get('unreadOnly') === 'true';

      // Fetch recent notifications from settings
      const notificationSettings = await prisma.setting.findMany({
        where: {
          category: 'notifications',
          key: {
            startsWith: 'notification.',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      // Parse notifications from settings
      const notifications = notificationSettings
        .map((setting: any) => {
          try {
            return JSON.parse(setting.value);
          } catch (err) {
            logger.warn('Failed to parse notification:', { key: setting.key });
            return null;
          }
        })
        .filter(Boolean);

      // Filter unread if requested
      const filteredNotifications = unreadOnly
        ? notifications.filter((n: any) => !n.read)
        : notifications;

      // Also check for new real-time events from database
      const recentEvents = await checkForNewEvents();

      // Combine stored notifications with new events
      const allNotifications = [
        ...recentEvents,
        ...filteredNotifications,
      ].slice(0, limit);

      return NextResponse.json({
        success: true,
        notifications: allNotifications,
      });
    } catch (error) {
      logger.error('Error fetching notifications:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch notifications',
  }
);

// Check for new events from the database
async function checkForNewEvents() {
  const notifications: any[] = [];

  try {
    // Check for new vehicle inquiries
    const recentInquiries = await prisma.vehicleInquiry.findMany({
      where: {
        status: 'NEW',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    for (const inquiry of recentInquiries) {
      const notification = await createNotification({
        type: 'success',
        category: 'inquiry',
        title: 'New Vehicle Inquiry',
        message: `${inquiry.name} inquired about ${inquiry.vehicle.make} ${inquiry.vehicle.model} ${inquiry.vehicle.year}`,
        actionUrl: '/admin?tab=customers',
        metadata: {
          inquiryId: inquiry.id,
          vehicleId: inquiry.vehicleId,
          customerEmail: inquiry.email,
        },
      });
      notifications.push(notification);
    }

    // Check for new contact submissions
    const recentContacts = await prisma.contact.findMany({
      where: {
        status: 'NEW',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    for (const contact of recentContacts) {
      const notification = await createNotification({
        type: 'info',
        category: 'system',
        title: 'New Contact Message',
        message: `${contact.name} sent a message: ${contact.subject || 'General Inquiry'}`,
        actionUrl: '/admin?tab=customers',
        metadata: {
          contactId: contact.id,
          customerEmail: contact.email,
        },
      });
      notifications.push(notification);
    }

    // Check for low inventory
    const vehicleStats = await prisma.vehicle.groupBy({
      by: ['bodyType'],
      where: {
        status: 'AVAILABLE',
      },
      _count: true,
    });

    for (const stat of vehicleStats) {
      if (stat._count < 5) {
        const notification = await createNotification({
          type: 'warning',
          category: 'vehicle',
          title: 'Low Inventory Alert',
          message: `Only ${stat._count} vehicles available in ${stat.bodyType} category`,
          actionUrl: '/admin?tab=inventory',
        });
        notifications.push(notification);
      }
    }

    // Check for upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 5,
    });

    for (const appointment of upcomingAppointments) {
      const notification = await createNotification({
        type: 'info',
        category: 'appointment',
        title: 'Upcoming Appointment',
        message: `${appointment.customerName} scheduled for ${appointment.type} at ${appointment.scheduledTime}`,
        actionUrl: '/admin?tab=appointments',
        metadata: {
          appointmentId: appointment.id,
          customerEmail: appointment.customerEmail,
        },
      });
      notifications.push(notification);
    }
  } catch (error) {
    logger.error('Error checking for new events:', { error: error instanceof Error ? error.message : String(error) });
  }

  return notifications;
}

// PATCH /api/admin/notifications/:id/read - Mark notification as read (SECURED)
export const PATCH = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const notificationId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];

      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: 'Notification ID required' },
          { status: 400 }
        );
      }

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
);

// DELETE /api/admin/notifications/:id - Delete a notification (SECURED)
export const DELETE = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const notificationId = request.nextUrl.pathname.split('/').pop();

      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: 'Notification ID required' },
          { status: 400 }
        );
      }

      await prisma.setting.delete({
        where: {
          key: `notification.${notificationId}`,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error deleting notification:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to delete notification' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Delete notification',
    auditSensitive: true,
  }
);