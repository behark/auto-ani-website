/**
 * Conversion Tracking for AUTO ANI
 * Track all conversion events and attribution data
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ConversionEventData {
  eventName: string;
  eventValue?: number;
  leadId?: string;
  visitorId?: string;
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  context?: {
    pageUrl?: string;
    referrer?: string;
    clientIP?: string;
    userAgent?: string;
  };
  metadata?: Record<string, any>;
}

export class ConversionTracking {
  /**
   * Track conversion event
   */
  static async trackEvent(data: ConversionEventData) {
    try {
      const event = await prisma.conversionEvent.create({
        data: {
          eventName: data.eventName,
          eventValue: data.eventValue,
          leadId: data.leadId,
          visitorId: data.visitorId,
          source: data.attribution?.source,
          medium: data.attribution?.medium,
          campaign: data.attribution?.campaign,
          content: data.attribution?.content,
          term: data.attribution?.term,
          pageUrl: data.context?.pageUrl,
          referrer: data.context?.referrer,
          clientIP: data.context?.clientIP,
          userAgent: data.context?.userAgent,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        },
      });

      logger.info('Conversion event tracked', {
        eventId: event.id,
        eventName: event.eventName,
        leadId: data.leadId,
      });

      // Update daily analytics
      await this.updateDailyAnalytics(data);

      return event;
    } catch (error) {
      logger.error('Failed to track conversion event', { data }, error as Error);
      throw error;
    }
  }

  /**
   * Track form submission
   */
  static async trackFormSubmit(
    formType: string,
    leadId?: string,
    visitorId?: string,
    metadata?: Record<string, any>
  ) {
    return await this.trackEvent({
      eventName: 'FORM_SUBMIT',
      leadId,
      visitorId,
      metadata: { formType, ...metadata },
    });
  }

  /**
   * Track vehicle inquiry
   */
  static async trackInquiry(vehicleId: string, leadId?: string, visitorId?: string) {
    return await this.trackEvent({
      eventName: 'INQUIRY',
      eventValue: 100, // Base value for inquiry
      leadId,
      visitorId,
      metadata: { vehicleId },
    });
  }

  /**
   * Track test drive request
   */
  static async trackTestDrive(vehicleId: string, leadId?: string, visitorId?: string) {
    return await this.trackEvent({
      eventName: 'TEST_DRIVE',
      eventValue: 200, // Higher value for test drive
      leadId,
      visitorId,
      metadata: { vehicleId },
    });
  }

  /**
   * Track lead magnet download
   */
  static async trackLeadMagnetDownload(
    magnetId: string,
    leadId?: string,
    visitorId?: string
  ) {
    return await this.trackEvent({
      eventName: 'DOWNLOAD',
      eventValue: 50,
      leadId,
      visitorId,
      metadata: { magnetId, type: 'lead_magnet' },
    });
  }

  /**
   * Track vehicle sale (conversion)
   */
  static async trackSale(vehicleId: string, saleAmount: number, leadId: string) {
    return await this.trackEvent({
      eventName: 'PURCHASE',
      eventValue: saleAmount,
      leadId,
      metadata: { vehicleId },
    });
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnel(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get counts for each funnel stage
      const [
        visitors,
        pageViews,
        inquiries,
        testDrives,
        purchases,
      ] = await Promise.all([
        prisma.conversionEvent.count({
          where: { ...where, eventName: 'PAGE_VIEW' },
        }),
        prisma.conversionEvent.groupBy({
          by: ['visitorId'],
          where: { ...where, eventName: 'PAGE_VIEW' },
          _count: true,
        }),
        prisma.conversionEvent.count({
          where: { ...where, eventName: 'INQUIRY' },
        }),
        prisma.conversionEvent.count({
          where: { ...where, eventName: 'TEST_DRIVE' },
        }),
        prisma.conversionEvent.count({
          where: { ...where, eventName: 'PURCHASE' },
        }),
      ]);

      const uniqueVisitors = pageViews.length;
      const totalRevenue = await prisma.conversionEvent.aggregate({
        where: { ...where, eventName: 'PURCHASE' },
        _sum: { eventValue: true },
      });

      return {
        funnel: {
          visitors: uniqueVisitors,
          inquiries,
          testDrives,
          purchases,
        },
        conversionRates: {
          visitorToInquiry: uniqueVisitors > 0 ? (inquiries / uniqueVisitors) * 100 : 0,
          inquiryToTestDrive: inquiries > 0 ? (testDrives / inquiries) * 100 : 0,
          testDriveToPurchase: testDrives > 0 ? (purchases / testDrives) * 100 : 0,
          overallConversion: uniqueVisitors > 0 ? (purchases / uniqueVisitors) * 100 : 0,
        },
        revenue: {
          total: totalRevenue._sum.eventValue || 0,
          average: purchases > 0 ? (totalRevenue._sum.eventValue || 0) / purchases : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get conversion funnel', { startDate, endDate }, error as Error);
      throw error;
    }
  }

  /**
   * Get attribution report
   */
  static async getAttributionReport(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Group by source
      const bySource = await prisma.conversionEvent.groupBy({
        by: ['source'],
        where: { ...where, source: { not: null } },
        _count: true,
        _sum: { eventValue: true },
      });

      // Group by campaign
      const byCampaign = await prisma.conversionEvent.groupBy({
        by: ['campaign'],
        where: { ...where, campaign: { not: null } },
        _count: true,
        _sum: { eventValue: true },
      });

      // Group by medium
      const byMedium = await prisma.conversionEvent.groupBy({
        by: ['medium'],
        where: { ...where, medium: { not: null } },
        _count: true,
        _sum: { eventValue: true },
      });

      return {
        bySource: bySource.map((item: any) => ({
          source: item.source,
          conversions: item._count,
          revenue: item._sum.eventValue || 0,
        })),
        byCampaign: byCampaign.map((item: any) => ({
          campaign: item.campaign,
          conversions: item._count,
          revenue: item._sum.eventValue || 0,
        })),
        byMedium: byMedium.map((item: any) => ({
          medium: item.medium,
          conversions: item._count,
          revenue: item._sum.eventValue || 0,
        })),
      };
    } catch (error) {
      logger.error('Failed to get attribution report', { startDate, endDate }, error as Error);
      throw error;
    }
  }

  /**
   * Update daily analytics
   */
  private static async updateDailyAnalytics(data: ConversionEventData) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await prisma.dailyAnalytics.findUnique({
        where: { date: today },
      });

      if (!analytics) {
        analytics = await prisma.dailyAnalytics.create({
          data: { date: today },
        });
      }

      const updateData: any = {};

      // Update based on event type
      if (data.eventName === 'PAGE_VIEW') {
        updateData.pageViews = { increment: 1 };
      } else if (data.eventName === 'INQUIRY') {
        updateData.inquiries = { increment: 1 };
      } else if (data.eventName === 'TEST_DRIVE') {
        updateData.testDrives = { increment: 1 };
      } else if (data.eventName === 'PURCHASE') {
        updateData.sales = { increment: 1 };
        if (data.eventValue) {
          updateData.revenue = { increment: data.eventValue };
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.dailyAnalytics.update({
          where: { date: today },
          data: updateData,
        });
      }
    } catch (error) {
      logger.error('Failed to update daily analytics', { data }, error as Error);
    }
  }

  /**
   * Get top converting pages
   */
  static async getTopConvertingPages(limit: number = 10) {
    try {
      const pages = await prisma.conversionEvent.groupBy({
        by: ['pageUrl'],
        where: {
          pageUrl: { not: null },
          eventName: { in: ['INQUIRY', 'PURCHASE', 'DOWNLOAD'] },
        },
        _count: true,
        orderBy: { _count: { pageUrl: 'desc' } },
        take: limit,
      });

      return pages.map((page: any) => ({
        pageUrl: page.pageUrl,
        conversions: page._count,
      }));
    } catch (error) {
      logger.error('Failed to get top converting pages', {}, error as Error);
      throw error;
    }
  }

  /**
   * Get conversion timeline
   */
  static async getConversionTimeline(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await prisma.conversionEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          eventName: { in: ['INQUIRY', 'TEST_DRIVE', 'PURCHASE'] },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const timeline: Record<string, any> = {};
      events.forEach((event: any) => {
        const date = event.createdAt.toISOString().split('T')[0];
        if (!timeline[date]) {
          timeline[date] = { date, inquiries: 0, testDrives: 0, purchases: 0, revenue: 0 };
        }

        if (event.eventName === 'INQUIRY') timeline[date].inquiries++;
        else if (event.eventName === 'TEST_DRIVE') timeline[date].testDrives++;
        else if (event.eventName === 'PURCHASE') {
          timeline[date].purchases++;
          timeline[date].revenue += event.eventValue || 0;
        }
      });

      return Object.values(timeline);
    } catch (error) {
      logger.error('Failed to get conversion timeline', { days }, error as Error);
      throw error;
    }
  }
}