/**
 * Lead Scoring Engine for AUTO ANI
 * Automatically scores and qualifies leads based on behavioral and demographic data
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Scoring configuration
export const SCORE_WEIGHTS = {
  // Behavioral signals
  PAGE_VIEW: 2,
  VEHICLE_VIEW: 10,
  VEHICLE_VIEW_MULTIPLE: 15, // Viewed same vehicle multiple times
  FAVORITES_ADD: 8,
  FORM_SUBMIT: 25,
  INQUIRY: 30,
  TEST_DRIVE_REQUEST: 50,
  FINANCING_INQUIRY: 40,

  // Engagement signals
  EMAIL_OPEN: 3,
  EMAIL_CLICK: 8,
  EMAIL_REPLY: 15,
  PHONE_CALL: 20,

  // Download signals
  LEAD_MAGNET_DOWNLOAD: 12,
  GUIDE_DOWNLOAD: 15,

  // Recency bonus
  ACTIVITY_TODAY: 5,
  ACTIVITY_THIS_WEEK: 3,

  // Qualification data
  BUDGET_PROVIDED: 10,
  TIMEFRAME_IMMEDIATE: 20,
  TIMEFRAME_1_MONTH: 15,
  TIMEFRAME_3_MONTHS: 8,
  PHONE_VERIFIED: 12,
  EMAIL_VERIFIED: 8,
};

// Temperature thresholds
export const TEMPERATURE_THRESHOLDS = {
  HOT: 100,
  WARM: 50,
  COLD: 0,
};

// Lead status determination
export const STATUS_CRITERIA = {
  QUALIFIED: 60,
  HOT: 100,
};

export interface LeadScoringData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source: string;
  sourceDetails?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  qualificationData?: {
    budget?: number;
    timeframe?: string;
    preferredVehicleType?: string;
    financingNeeded?: boolean;
    tradeInVehicle?: boolean;
    buyingIntent?: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  metadata?: Record<string, any>;
  clientIP?: string;
  fingerprint?: string;
  userAgent?: string;
}

export interface ActivityData {
  activityType: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class LeadScoringEngine {
  /**
   * Create or update a lead with scoring
   */
  static async createOrUpdateLead(data: LeadScoringData) {
    try {
      const existingLead = await prisma.lead.findUnique({
        where: { email: data.email },
        include: { activities: true },
      });

      let lead;
      if (existingLead) {
        // Update existing lead
        lead = await prisma.lead.update({
          where: { email: data.email },
          data: {
            firstName: data.firstName || existingLead.firstName,
            lastName: data.lastName || existingLead.lastName,
            phone: data.phone || existingLead.phone,
            source: data.source || existingLead.source,
            sourceDetails: data.sourceDetails || existingLead.sourceDetails,
            utmSource: data.utmParams?.source || existingLead.utmSource,
            utmMedium: data.utmParams?.medium || existingLead.utmMedium,
            utmCampaign: data.utmParams?.campaign || existingLead.utmCampaign,
            utmContent: data.utmParams?.content || existingLead.utmContent,
            utmTerm: data.utmParams?.term || existingLead.utmTerm,
            budget: data.qualificationData?.budget || existingLead.budget,
            timeframe: data.qualificationData?.timeframe || existingLead.timeframe,
            preferredVehicleType: data.qualificationData?.preferredVehicleType || existingLead.preferredVehicleType,
            financingNeeded: data.qualificationData?.financingNeeded ?? existingLead.financingNeeded,
            tradeInVehicle: data.qualificationData?.tradeInVehicle ?? existingLead.tradeInVehicle,
            buyingIntent: data.qualificationData?.buyingIntent || existingLead.buyingIntent,
            metadata: data.metadata ? JSON.stringify(data.metadata) : existingLead.metadata,
            lastEngagedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info('Lead updated', { leadId: lead.id, email: lead.email });
      } else {
        // Create new lead
        const initialScore = this.calculateInitialScore(data);
        const temperature = this.determineTemperature(initialScore);
        const status = this.determineStatus(initialScore);

        lead = await prisma.lead.create({
          data: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            source: data.source,
            sourceDetails: data.sourceDetails,
            status,
            score: initialScore,
            temperature,
            utmSource: data.utmParams?.source,
            utmMedium: data.utmParams?.medium,
            utmCampaign: data.utmParams?.campaign,
            utmContent: data.utmParams?.content,
            utmTerm: data.utmParams?.term,
            budget: data.qualificationData?.budget,
            timeframe: data.qualificationData?.timeframe,
            preferredVehicleType: data.qualificationData?.preferredVehicleType,
            financingNeeded: data.qualificationData?.financingNeeded ?? false,
            tradeInVehicle: data.qualificationData?.tradeInVehicle ?? false,
            buyingIntent: data.qualificationData?.buyingIntent,
            clientIP: data.clientIP,
            fingerprint: data.fingerprint,
            userAgent: data.userAgent,
            metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
            lastEngagedAt: new Date(),
          },
        });

        logger.info('New lead created', {
          leadId: lead.id,
          email: lead.email,
          score: lead.score,
          temperature: lead.temperature,
        });
      }

      return lead;
    } catch (error) {
      logger.error('Failed to create/update lead', { email: data.email }, error as Error);
      throw error;
    }
  }

  /**
   * Track lead activity and update score
   */
  static async trackActivity(leadId: string, activity: ActivityData) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { activities: { orderBy: { createdAt: 'desc' }, take: 100 } },
      });

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Calculate score change
      const scoreChange = this.calculateActivityScore(activity, lead.activities);

      // Create activity record
      await prisma.leadActivity.create({
        data: {
          leadId,
          activityType: activity.activityType,
          description: activity.description,
          metadata: activity.metadata ? JSON.stringify(activity.metadata) : undefined,
          scoreChange,
        },
      });

      // Update lead score
      const newScore = Math.max(0, lead.score + scoreChange);
      const newTemperature = this.determineTemperature(newScore);
      const newStatus = this.determineStatus(newScore, lead.status);

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          score: newScore,
          temperature: newTemperature,
          status: newStatus,
          lastEngagedAt: new Date(),
        },
      });

      logger.info('Lead activity tracked', {
        leadId,
        activityType: activity.activityType,
        scoreChange,
        newScore,
        newTemperature,
      });

      return { scoreChange, newScore, newTemperature, newStatus };
    } catch (error) {
      logger.error('Failed to track lead activity', { leadId, activity }, error as Error);
      throw error;
    }
  }

  /**
   * Track activity by email (for leads not yet in system)
   */
  static async trackActivityByEmail(email: string, activity: ActivityData) {
    try {
      let lead = await prisma.lead.findUnique({
        where: { email },
      });

      if (!lead) {
        // Create lead if doesn't exist
        lead = await this.createOrUpdateLead({
          email,
          source: 'WEBSITE',
          sourceDetails: 'Anonymous visitor activity',
        });
      }

      return await this.trackActivity(lead.id, activity);
    } catch (error) {
      logger.error('Failed to track activity by email', { email, activity }, error as Error);
      throw error;
    }
  }

  /**
   * Calculate initial score based on lead data
   */
  private static calculateInitialScore(data: LeadScoringData): number {
    let score = 0;

    // Source-based scoring
    if (data.source === 'REFERRAL') score += 20;
    else if (data.source === 'AD') score += 10;
    else if (data.source === 'ORGANIC') score += 15;

    // Qualification data scoring
    if (data.qualificationData) {
      if (data.qualificationData.budget) score += SCORE_WEIGHTS.BUDGET_PROVIDED;

      if (data.qualificationData.timeframe === 'IMMEDIATE') {
        score += SCORE_WEIGHTS.TIMEFRAME_IMMEDIATE;
      } else if (data.qualificationData.timeframe === '1_MONTH') {
        score += SCORE_WEIGHTS.TIMEFRAME_1_MONTH;
      } else if (data.qualificationData.timeframe === '3_MONTHS') {
        score += SCORE_WEIGHTS.TIMEFRAME_3_MONTHS;
      }

      if (data.qualificationData.buyingIntent === 'HIGH') score += 30;
      else if (data.qualificationData.buyingIntent === 'MEDIUM') score += 15;

      if (data.qualificationData.financingNeeded) score += 10;
      if (data.qualificationData.tradeInVehicle) score += 8;
    }

    // Phone provided
    if (data.phone) score += 10;

    return score;
  }

  /**
   * Calculate score for an activity
   */
  private static calculateActivityScore(activity: ActivityData, recentActivities: any[]): number {
    let score = 0;

    // Base activity score
    const baseScore = (SCORE_WEIGHTS as any)[activity.activityType] || 0;
    score += baseScore;

    // Recency bonus
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const hasActivityToday = recentActivities.some(a =>
      new Date(a.createdAt) >= todayStart
    );
    const hasActivityThisWeek = recentActivities.some(a =>
      new Date(a.createdAt) >= weekStart
    );

    if (hasActivityToday) score += SCORE_WEIGHTS.ACTIVITY_TODAY;
    else if (hasActivityThisWeek) score += SCORE_WEIGHTS.ACTIVITY_THIS_WEEK;

    // Multiple vehicle views bonus
    if (activity.activityType === 'VEHICLE_VIEW') {
      const vehicleId = activity.metadata?.vehicleId;
      if (vehicleId) {
        const sameVehicleViews = recentActivities.filter(a => {
          if (a.activityType !== 'VEHICLE_VIEW') return false;
          try {
            const meta = JSON.parse(a.metadata || '{}');
            return meta.vehicleId === vehicleId;
          } catch {
            return false;
          }
        });

        if (sameVehicleViews.length >= 2) {
          score += SCORE_WEIGHTS.VEHICLE_VIEW_MULTIPLE - SCORE_WEIGHTS.VEHICLE_VIEW;
        }
      }
    }

    return score;
  }

  /**
   * Determine temperature based on score
   */
  private static determineTemperature(score: number): string {
    if (score >= TEMPERATURE_THRESHOLDS.HOT) return 'HOT';
    if (score >= TEMPERATURE_THRESHOLDS.WARM) return 'WARM';
    return 'COLD';
  }

  /**
   * Determine status based on score
   */
  private static determineStatus(score: number, currentStatus?: string): string {
    if (score >= STATUS_CRITERIA.HOT && currentStatus !== 'CONVERTED') {
      return 'HOT';
    }
    if (score >= STATUS_CRITERIA.QUALIFIED && currentStatus === 'NEW') {
      return 'QUALIFIED';
    }
    return currentStatus || 'NEW';
  }

  /**
   * Get lead qualification insights
   */
  static async getLeadInsights(leadId: string) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Activity breakdown
      const activityCounts = lead.activities.reduce((acc: any, activity: any) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Engagement metrics
      const daysSinceFirstActivity = lead.createdAt
        ? Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const daysSinceLastEngagement = lead.lastEngagedAt
        ? Math.floor((Date.now() - lead.lastEngagedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        lead: {
          id: lead.id,
          email: lead.email,
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
          score: lead.score,
          temperature: lead.temperature,
          status: lead.status,
        },
        engagement: {
          totalActivities: lead.activities.length,
          activityBreakdown: activityCounts,
          daysSinceFirstActivity,
          daysSinceLastEngagement,
        },
        qualification: {
          budget: lead.budget,
          timeframe: lead.timeframe,
          buyingIntent: lead.buyingIntent,
          preferredVehicleType: lead.preferredVehicleType,
          financingNeeded: lead.financingNeeded,
          tradeInVehicle: lead.tradeInVehicle,
        },
        attribution: {
          source: lead.source,
          sourceDetails: lead.sourceDetails,
          utmSource: lead.utmSource,
          utmMedium: lead.utmMedium,
          utmCampaign: lead.utmCampaign,
        },
      };
    } catch (error) {
      logger.error('Failed to get lead insights', { leadId }, error as Error);
      throw error;
    }
  }

  /**
   * Get hot leads for follow-up
   */
  static async getHotLeads(limit: number = 50) {
    try {
      const leads = await prisma.lead.findMany({
        where: {
          temperature: 'HOT',
          status: {
            notIn: ['CONVERTED', 'LOST'],
          },
        },
        orderBy: [
          { score: 'desc' },
          { lastEngagedAt: 'desc' },
        ],
        take: limit,
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      return leads;
    } catch (error) {
      logger.error('Failed to get hot leads', {}, error as Error);
      throw error;
    }
  }

  /**
   * Get leads needing re-engagement
   */
  static async getStaleLeads(daysSinceLastEngagement: number = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysSinceLastEngagement * 24 * 60 * 60 * 1000);

      const leads = await prisma.lead.findMany({
        where: {
          lastEngagedAt: {
            lt: cutoffDate,
          },
          status: {
            notIn: ['CONVERTED', 'LOST'],
          },
          score: {
            gte: 40, // Only re-engage leads with decent scores
          },
        },
        orderBy: [
          { score: 'desc' },
          { lastEngagedAt: 'asc' },
        ],
        take: 100,
      });

      return leads;
    } catch (error) {
      logger.error('Failed to get stale leads', {}, error as Error);
      throw error;
    }
  }
}