import { prisma } from '@/lib/database';
import {
  // DailyAnalytics, // Model doesn't exist in schema
  VehicleInquiry,
} from '@prisma/client';
import {
  SalesTransaction,
  EmailLog,
  SMSLog,
  PageAnalytics,
  CampaignMetrics,
  Customer,
  LeadScore,
} from '@/lib/types/missing-models';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  campaignId?: string;
  salesPersonId?: string;
  customerId?: string;
  vehicleId?: string;
  source?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface MetricsSummary {
  totalRevenue: number;
  totalSales: number;
  totalLeads: number;
  conversionRate: number;
  averageDealSize: number;
  averageLeadScore: number;
  customerLifetimeValue: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalSales: number;
  averageDealSize: number;
  grossProfit: number;
  profitMargin: number;
  topSalespeople: Array<{
    salesPersonId: string;
    name: string;
    totalRevenue: number;
    totalSales: number;
    commission: number;
  }>;
  salesByMonth: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
  topVehicles: Array<{
    vehicleId: string;
    make: string;
    model: string;
    sales: number;
    revenue: number;
  }>;
}

export interface LeadMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  averageLeadScore: number;
  leadsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  leadsByGrade: Array<{
    grade: string;
    count: number;
    conversionRate: number;
  }>;
  leadConversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export interface MarketingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalRevenue: number;
  roas: number; // Return on Ad Spend
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  emailMetrics: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  smsMetrics: {
    totalSent: number;
    deliveryRate: number;
    failureRate: number;
    optOutRate: number;
  };
  topPerformingCampaigns: Array<{
    campaignId: string;
    name: string;
    roas: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface InventoryMetrics {
  totalVehicles: number;
  availableVehicles: number;
  soldVehicles: number;
  reservedVehicles: number;
  averageDaysInInventory: number;
  inventoryTurnover: number;
  topPerformingModels: Array<{
    make: string;
    model: string;
    totalSales: number;
    averageDaysToSell: number;
  }>;
  agingInventory: Array<{
    ageCategory: string;
    count: number;
    percentage: number;
    averagePrice: number;
  }>;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  averageLifetimeValue: number;
  retentionRate: number;
  churnRate: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    lifetimeValue: number;
    totalPurchases: number;
  }>;
  customerSegmentation: Array<{
    segment: string;
    count: number;
    averageValue: number;
  }>;
}

export interface WebsiteMetrics {
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{
    page: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    visitors: number;
    percentage: number;
  }>;
}

export class AnalyticsEngine {

  // Dashboard Overview
  static async getDashboardMetrics(filters: AnalyticsFilters = {}): Promise<MetricsSummary> {
    const { startDate, endDate } = this.getDateRange(filters);

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      salesData,
      leadsData,
      customersData,
      leadScoresData
    ] = await Promise.all([
      prisma.salesTransaction.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: true,
        _avg: { totalAmount: true }
      }),
      prisma.vehicleInquiry.count({ where: whereClause }),
      prisma.customer.aggregate({
        where: whereClause,
        _count: true,
        _avg: { lifetimeValue: true }
      }),
      prisma.leadScore.aggregate({
        where: { calculatedAt: whereClause.createdAt },
        _avg: { totalScore: true }
      })
    ]);

    const totalRevenue = salesData._sum.totalAmount || 0;
    const totalSales = salesData._count;
    const totalLeads = leadsData;
    const averageDealSize = salesData._avg.totalAmount || 0;
    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    // Get new vs returning customers
    const existingCustomerIds = await prisma.customer.findMany({
      where: {
        createdAt: { lt: startDate }
      },
      select: { id: true }
    });

    const existingIds = new Set(existingCustomerIds.map((c: { id: string }) => c.id));

    const recentCustomers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true }
    });

    const newCustomers = recentCustomers.filter((c: { id: string }) => !existingIds.has(c.id)).length;
    const returningCustomers = recentCustomers.length - newCustomers;

    return {
      totalRevenue,
      totalSales,
      totalLeads,
      conversionRate,
      averageDealSize,
      averageLeadScore: leadScoresData._avg.totalScore || 0,
      customerLifetimeValue: customersData._avg.lifetimeValue || 0,
      newCustomers,
      returningCustomers
    };
  }

  // Sales Analytics
  static async getSalesMetrics(filters: AnalyticsFilters = {}): Promise<SalesMetrics> {
    const { startDate, endDate } = this.getDateRange(filters);

    const whereClause: any = { status: 'COMPLETED' };
    if (startDate && endDate) {
      whereClause.completedAt = {
        gte: startDate,
        lte: endDate
      };
    }

    // Basic sales metrics
    const salesAggregate = await prisma.salesTransaction.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
        grossProfit: true,
        commission: true
      },
      _count: true,
      _avg: { totalAmount: true }
    });

    // Top salespeople
    const topSalespeople = await prisma.salesTransaction.groupBy({
      by: ['salesPersonId'],
      where: whereClause,
      _sum: {
        totalAmount: true,
        commission: true
      },
      _count: true,
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    // Sales by month
    const salesByMonth = await prisma.$queryRaw<Array<{
      month: string;
      revenue: number;
      sales: number;
    }>>`
      SELECT
        TO_CHAR(completed_at, 'YYYY-MM') as month,
        SUM(total_amount)::int as revenue,
        COUNT(*)::int as sales
      FROM sales_transactions
      WHERE status = 'COMPLETED'
        AND completed_at >= ${startDate}
        AND completed_at <= ${endDate}
      GROUP BY TO_CHAR(completed_at, 'YYYY-MM')
      ORDER BY month
    `;

    // Top vehicles
    const topVehicles = await prisma.salesTransaction.groupBy({
      by: ['vehicleId'],
      where: whereClause,
      _sum: { totalAmount: true },
      _count: true,
      orderBy: {
        _count: {
          vehicleId: 'desc'
        }
      },
      take: 10
    });

    // Get salesperson names
    const salespeopleData = await prisma.salesTeam.findMany({
      where: {
        id: { in: topSalespeople.map((s: any) => s.salesPersonId) }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    // Get vehicle details
    const vehicleData = await prisma.vehicle.findMany({
      where: {
        id: { in: topVehicles.map((v: any) => v.vehicleId) }
      },
      select: {
        id: true,
        make: true,
        model: true
      }
    });

    const totalRevenue = salesAggregate._sum.totalAmount || 0;
    const totalSales = salesAggregate._count;
    const grossProfit = salesAggregate._sum.grossProfit || 0;

    return {
      totalRevenue,
      totalSales,
      averageDealSize: salesAggregate._avg.totalAmount || 0,
      grossProfit,
      profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      topSalespeople: topSalespeople.map((sp: any) => {
        const person = salespeopleData.find((p: any) => p.id === sp.salesPersonId);
        return {
          salesPersonId: sp.salesPersonId,
          name: person ? `${person.firstName} ${person.lastName}` : 'Unknown',
          totalRevenue: sp._sum.totalAmount || 0,
          totalSales: sp._count,
          commission: sp._sum.commission || 0
        };
      }),
      salesByMonth,
      topVehicles: topVehicles.map((tv: any) => {
        const vehicle = vehicleData.find((v: any) => v.id === tv.vehicleId);
        return {
          vehicleId: tv.vehicleId,
          make: vehicle?.make || 'Unknown',
          model: vehicle?.model || 'Unknown',
          sales: tv._count,
          revenue: tv._sum.totalAmount || 0
        };
      })
    };
  }

  // Lead Analytics
  static async getLeadMetrics(filters: AnalyticsFilters = {}): Promise<LeadMetrics> {
    const { startDate, endDate } = this.getDateRange(filters);

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    // Basic lead metrics
    const totalLeads = await prisma.vehicleInquiry.count({ where: whereClause });

    const qualifiedLeads = await prisma.vehicleInquiry.count({
      where: {
        ...whereClause,
        status: { in: ['IN_PROGRESS', 'RESPONDED'] }
      }
    });

    // Conversion rate (leads to sales)
    const convertedLeads = await prisma.salesTransaction.count({
      where: {
        createdAt: whereClause.createdAt,
        status: 'COMPLETED'
      }
    });

    // Average lead score
    const avgLeadScore = await prisma.leadScore.aggregate({
      where: {
        calculatedAt: whereClause.createdAt
      },
      _avg: { totalScore: true }
    });

    // Leads by source
    const leadsBySource = await prisma.vehicleInquiry.groupBy({
      by: ['source'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          source: 'desc'
        }
      }
    });

    // Leads by grade
    const leadsByGrade = await prisma.leadScore.groupBy({
      by: ['grade'],
      where: {
        calculatedAt: whereClause.createdAt
      },
      _count: true
    });

    return {
      totalLeads,
      qualifiedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      averageLeadScore: avgLeadScore._avg.totalScore || 0,
      leadsBySource: leadsBySource.map((source: any) => ({
        source: source.source || 'Unknown',
        count: source._count,
        percentage: totalLeads > 0 ? (source._count / totalLeads) * 100 : 0
      })),
      leadsByGrade: leadsByGrade.map((grade: any) => ({
        grade: grade.grade,
        count: grade._count,
        conversionRate: 0 // TODO: Calculate conversion rate by grade
      })),
      leadConversionFunnel: [
        { stage: 'Leads', count: totalLeads, percentage: 100 },
        { stage: 'Qualified', count: qualifiedLeads, percentage: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0 },
        { stage: 'Converted', count: convertedLeads, percentage: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0 }
      ]
    };
  }

  // Marketing Analytics
  static async getMarketingMetrics(filters: AnalyticsFilters = {}): Promise<MarketingMetrics> {
    const { startDate, endDate } = this.getDateRange(filters);

    // Campaign metrics
    const totalCampaigns = await prisma.marketingCampaign.count();
    const activeCampaigns = await prisma.marketingCampaign.count({
      where: { status: 'ACTIVE' }
    });

    // Email metrics
    const emailMetrics = await prisma.emailLog.aggregate({
      where: {
        sentAt: startDate && endDate ? {
          gte: startDate,
          lte: endDate
        } : undefined
      },
      _count: {
        _all: true,
        openedAt: true,
        clickedAt: true,
        bouncedAt: true,
        deliveredAt: true
      }
    });

    // SMS metrics
    const smsMetrics = await prisma.sMSLog.aggregate({
      where: {
        sentAt: startDate && endDate ? {
          gte: startDate,
          lte: endDate
        } : undefined
      },
      _count: {
        _all: true,
        deliveredAt: true,
        failedAt: true
      }
    });

    const totalEmailSent = emailMetrics._count._all;
    const totalSMSSent = smsMetrics._count._all;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpend: 0, // TODO: Calculate from campaign costs
      totalRevenue: 0, // TODO: Calculate revenue from campaigns
      roas: 0, // TODO: Calculate ROAS
      totalImpressions: 0, // TODO: Get from campaign metrics
      totalClicks: 0, // TODO: Get from campaign metrics
      averageCtr: 0, // TODO: Calculate CTR
      emailMetrics: {
        totalSent: totalEmailSent,
        deliveryRate: totalEmailSent > 0 ? (emailMetrics._count.deliveredAt! / totalEmailSent) * 100 : 0,
        openRate: totalEmailSent > 0 ? (emailMetrics._count.openedAt! / totalEmailSent) * 100 : 0,
        clickRate: totalEmailSent > 0 ? (emailMetrics._count.clickedAt! / totalEmailSent) * 100 : 0,
        bounceRate: totalEmailSent > 0 ? (emailMetrics._count.bouncedAt! / totalEmailSent) * 100 : 0
      },
      smsMetrics: {
        totalSent: totalSMSSent,
        deliveryRate: totalSMSSent > 0 ? (smsMetrics._count.deliveredAt! / totalSMSSent) * 100 : 0,
        failureRate: totalSMSSent > 0 ? (smsMetrics._count.failedAt! / totalSMSSent) * 100 : 0,
        optOutRate: 0 // TODO: Calculate opt-out rate
      },
      topPerformingCampaigns: [] // TODO: Implement top campaigns
    };
  }

  // Website Analytics
  static async getWebsiteMetrics(filters: AnalyticsFilters = {}): Promise<WebsiteMetrics> {
    const { startDate, endDate } = this.getDateRange(filters);

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate.toISOString().split('T')[0],
        lte: endDate.toISOString().split('T')[0]
      };
    }

    // Aggregate website metrics
    const websiteAggregate = await prisma.pageAnalytics.aggregate({
      where: whereClause,
      _sum: {
        totalPageViews: true,
        uniqueVisitors: true,
        conversions: true,
        desktopVisitors: true,
        mobileVisitors: true,
        tabletVisitors: true,
        organicTraffic: true,
        directTraffic: true,
        referralTraffic: true,
        socialTraffic: true
      },
      _avg: {
        bounceRate: true,
        avgTimeOnPage: true
      }
    });

    // Top pages
    const topPages = await prisma.pageAnalytics.groupBy({
      by: ['landingPageId'],
      where: whereClause,
      _sum: {
        totalPageViews: true,
        conversions: true
      },
      orderBy: {
        _sum: {
          totalPageViews: 'desc'
        }
      },
      take: 10
    });

    const totalVisitors = websiteAggregate._sum.uniqueVisitors || 0;
    const totalPageViews = websiteAggregate._sum.totalPageViews || 0;

    return {
      totalPageViews,
      uniqueVisitors: totalVisitors,
      bounceRate: websiteAggregate._avg.bounceRate || 0,
      averageSessionDuration: websiteAggregate._avg.avgTimeOnPage || 0,
      topPages: [], // TODO: Get page names and calculate conversion rates
      trafficSources: [
        {
          source: 'Organic',
          visitors: websiteAggregate._sum.organicTraffic || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.organicTraffic || 0) / totalVisitors) * 100 : 0
        },
        {
          source: 'Direct',
          visitors: websiteAggregate._sum.directTraffic || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.directTraffic || 0) / totalVisitors) * 100 : 0
        },
        {
          source: 'Referral',
          visitors: websiteAggregate._sum.referralTraffic || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.referralTraffic || 0) / totalVisitors) * 100 : 0
        },
        {
          source: 'Social',
          visitors: websiteAggregate._sum.socialTraffic || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.socialTraffic || 0) / totalVisitors) * 100 : 0
        }
      ],
      deviceBreakdown: [
        {
          device: 'Desktop',
          visitors: websiteAggregate._sum.desktopVisitors || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.desktopVisitors || 0) / totalVisitors) * 100 : 0
        },
        {
          device: 'Mobile',
          visitors: websiteAggregate._sum.mobileVisitors || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.mobileVisitors || 0) / totalVisitors) * 100 : 0
        },
        {
          device: 'Tablet',
          visitors: websiteAggregate._sum.tabletVisitors || 0,
          percentage: totalVisitors > 0 ? ((websiteAggregate._sum.tabletVisitors || 0) / totalVisitors) * 100 : 0
        }
      ]
    };
  }

  // Utility Methods
  private static getDateRange(filters: AnalyticsFilters): { startDate: Date; endDate: Date } {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;

    if (!startDate) {
      // Default to last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  // Export Data
  static async exportAnalyticsData(filters: AnalyticsFilters = {}, format: 'csv' | 'json' = 'json') {
    const [
      dashboardMetrics,
      salesMetrics,
      leadMetrics,
      marketingMetrics,
      websiteMetrics
    ] = await Promise.all([
      this.getDashboardMetrics(filters),
      this.getSalesMetrics(filters),
      this.getLeadMetrics(filters),
      this.getMarketingMetrics(filters),
      this.getWebsiteMetrics(filters)
    ]);

    const data = {
      dashboardMetrics,
      salesMetrics,
      leadMetrics,
      marketingMetrics,
      websiteMetrics,
      generatedAt: new Date().toISOString(),
      filters
    };

    if (format === 'csv') {
      // TODO: Implement CSV conversion
      throw new Error('CSV export not yet implemented');
    }

    return data;
  }
}