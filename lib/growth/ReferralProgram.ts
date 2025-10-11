/**
 * Referral Program for AUTO ANI
 * Incentivize customers to refer friends and family
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { EmailService } from '@/lib/email';

export interface ReferralReward {
  type: 'DISCOUNT' | 'CASH' | 'POINTS' | 'SERVICE';
  value: number; // In cents for cash, percentage for discount, points for loyalty
  description: string;
}

export const DEFAULT_REWARDS: Record<string, ReferralReward> = {
  REFERRAL_SIGNUP: {
    type: 'POINTS',
    value: 100,
    description: '100 loyalty points for each friend who signs up',
  },
  REFERRAL_INQUIRY: {
    type: 'POINTS',
    value: 250,
    description: '250 loyalty points when your referral makes an inquiry',
  },
  REFERRAL_PURCHASE: {
    type: 'CASH',
    value: 50000, // 500 EUR in cents
    description: '500 EUR cash reward when your referral purchases a vehicle',
  },
  REFERRAL_TEST_DRIVE: {
    type: 'DISCOUNT',
    value: 10, // 10%
    description: '10% discount on services when your referral takes a test drive',
  },
};

export class ReferralProgram {
  /**
   * Generate unique referral code for a lead
   */
  static generateReferralCode(email: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const emailHash = email.substring(0, 3).toUpperCase();
    return `${emailHash}${timestamp}${randomStr}`.substring(0, 12);
  }

  /**
   * Create referral link for a lead
   */
  static async createReferralLink(leadId: string, referredEmail: string, expirationDays: number = 90) {
    try {
      const referrer = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!referrer) {
        throw new Error(`Referrer lead not found: ${leadId}`);
      }

      // Check if referral already exists
      const existingReferral = await prisma.referral.findFirst({
        where: {
          referrerId: leadId,
          referredEmail,
          status: { not: 'EXPIRED' },
        },
      });

      if (existingReferral) {
        return existingReferral;
      }

      // Create new referral
      const referralCode = ReferralProgram.generateReferralCode(referrer.email);
      const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

      const referral = await prisma.referral.create({
        data: {
          referrerId: leadId,
          referredEmail,
          referralCode,
          status: 'PENDING',
          expiresAt,
        },
      });

      logger.info('Referral created', {
        referralId: referral.id,
        referrerId: leadId,
        referredEmail,
        code: referralCode,
      });

      // Send referral email to friend
      await ReferralProgram.sendReferralEmail(referrer, referredEmail, referralCode);

      return referral;
    } catch (error) {
      logger.error('Failed to create referral', { leadId, referredEmail }, error as Error);
      throw error;
    }
  }

  /**
   * Track referral click
   */
  static async trackReferralClick(referralCode: string) {
    try {
      const referral = await prisma.referral.findUnique({
        where: { referralCode },
      });

      if (!referral) {
        logger.warn('Referral code not found', { referralCode });
        return null;
      }

      // Check if expired
      if (referral.expiresAt && referral.expiresAt < new Date()) {
        await prisma.referral.update({
          where: { referralCode },
          data: { status: 'EXPIRED' },
        });
        logger.warn('Referral code expired', { referralCode });
        return null;
      }

      // Update click count
      await prisma.referral.update({
        where: { referralCode },
        data: {
          clickCount: { increment: 1 },
          lastClickedAt: new Date(),
        },
      });

      logger.info('Referral click tracked', { referralCode, referralId: referral.id });

      return referral;
    } catch (error) {
      logger.error('Failed to track referral click', { referralCode }, error as Error);
      throw error;
    }
  }

  /**
   * Convert referral when referred person signs up
   */
  static async convertReferral(referralCode: string, referredLeadId: string) {
    try {
      const referral = await prisma.referral.findUnique({
        where: { referralCode },
        include: { referrer: true },
      });

      if (!referral) {
        throw new Error(`Referral not found: ${referralCode}`);
      }

      if (referral.status === 'CONVERTED') {
        logger.warn('Referral already converted', { referralCode });
        return referral;
      }

      // Update referral
      await prisma.referral.update({
        where: { referralCode },
        data: {
          referredId: referredLeadId,
          status: 'CONVERTED',
          convertedAt: new Date(),
        },
      });

      // Issue reward
      await ReferralProgram.issueReward(referral.id, DEFAULT_REWARDS.REFERRAL_SIGNUP);

      // Update referred lead with referral source
      await prisma.lead.update({
        where: { id: referredLeadId },
        data: {
          source: 'REFERRAL',
          sourceDetails: `Referred by ${referral.referrer.email}`,
        },
      });

      logger.info('Referral converted', {
        referralId: referral.id,
        referrerId: referral.referrerId,
        referredId: referredLeadId,
      });

      // Send success email to referrer
      await ReferralProgram.sendReferralSuccessEmail(referral.referrer, DEFAULT_REWARDS.REFERRAL_SIGNUP);

      return referral;
    } catch (error) {
      logger.error('Failed to convert referral', { referralCode, referredLeadId }, error as Error);
      throw error;
    }
  }

  /**
   * Issue reward to referrer
   */
  static async issueReward(referralId: string, reward: ReferralReward) {
    try {
      await prisma.referral.update({
        where: { id: referralId },
        data: {
          rewardType: reward.type,
          rewardValue: reward.value,
          rewardIssued: true,
          rewardIssuedAt: new Date(),
        },
      });

      logger.info('Referral reward issued', { referralId, reward });
    } catch (error) {
      logger.error('Failed to issue referral reward', { referralId, reward }, error as Error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a lead
   */
  static async getReferralStats(leadId: string) {
    try {
      const referrals = await prisma.referral.findMany({
        where: { referrerId: leadId },
        include: {
          referred: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      });

      const stats = {
        totalReferrals: referrals.length,
        pending: referrals.filter((r: any) => r.status === 'PENDING').length,
        converted: referrals.filter((r: any) => r.status === 'CONVERTED').length,
        rewarded: referrals.filter((r: any) => r.rewardIssued).length,
        totalClicks: referrals.reduce((sum: number, r: any) => sum + r.clickCount, 0),
        totalRewardValue: referrals
          .filter((r: any) => r.rewardIssued)
          .reduce((sum: number, r: any) => sum + (r.rewardValue || 0), 0),
        referrals: referrals.map((r: any) => ({
          id: r.id,
          referralCode: r.referralCode,
          referredEmail: r.referredEmail,
          referredName: r.referred
            ? `${r.referred.firstName || ''} ${r.referred.lastName || ''}`.trim()
            : 'Pending',
          status: r.status,
          clickCount: r.clickCount,
          convertedAt: r.convertedAt,
          rewardType: r.rewardType,
          rewardValue: r.rewardValue,
          rewardIssued: r.rewardIssued,
        })),
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get referral stats', { leadId }, error as Error);
      throw error;
    }
  }

  /**
   * Get top referrers (leaderboard)
   */
  static async getTopReferrers(limit: number = 10) {
    try {
      const referrers = await prisma.referral.groupBy({
        by: ['referrerId'],
        where: { status: 'CONVERTED' },
        _count: true,
        orderBy: { _count: { referrerId: 'desc' } },
        take: limit,
      });

      const leaderboard = await Promise.all(
        referrers.map(async (item: any) => {
          const lead = await prisma.lead.findUnique({
            where: { id: item.referrerId },
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          });

          return {
            leadId: item.referrerId,
            name: lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : 'Unknown',
            email: lead?.email || '',
            referralCount: item._count,
          };
        })
      );

      return leaderboard;
    } catch (error) {
      logger.error('Failed to get top referrers', {}, error as Error);
      throw error;
    }
  }

  /**
   * Send referral invitation email
   */
  private static async sendReferralEmail(
    referrer: any,
    referredEmail: string,
    referralCode: string
  ) {
    try {
      const referralLink = `https://autosalonani.com?ref=${referralCode}`;
      const referrerName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || 'A friend';

      await EmailService.sendEmail({
        to: referredEmail,
        subject: `${referrerName} thinks you'll love AUTO ANI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been referred to AUTO ANI!</h2>
            <p>${referrerName} thought you might be interested in finding your perfect vehicle at AUTO ANI.</p>
            <p>We offer:</p>
            <ul>
              <li>Wide selection of quality vehicles</li>
              <li>Competitive financing options</li>
              <li>Expert customer service</li>
              <li>Trade-in services</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${referralLink}"
                 style="background: #007bff; color: white; padding: 15px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Browse Our Vehicles
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">
              This link was sent to you by ${referrer.email}.
              If you don't know this person, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      logger.info('Referral email sent', { referredEmail, referralCode });
    } catch (error) {
      logger.error('Failed to send referral email', { referredEmail, referralCode }, error as Error);
    }
  }

  /**
   * Send referral success notification to referrer
   */
  private static async sendReferralSuccessEmail(referrer: any, reward: ReferralReward) {
    try {
      const referrerName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || 'Valued Customer';

      let rewardText = '';
      if (reward.type === 'CASH') {
        rewardText = `${(reward.value / 100).toFixed(2)} EUR`;
      } else if (reward.type === 'DISCOUNT') {
        rewardText = `${reward.value}% discount`;
      } else if (reward.type === 'POINTS') {
        rewardText = `${reward.value} loyalty points`;
      } else {
        rewardText = reward.description;
      }

      await EmailService.sendEmail({
        to: referrer.email,
        subject: 'Your referral was successful!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Great news, ${referrerName}!</h2>
            <p>Your friend has signed up at AUTO ANI using your referral link.</p>
            <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Reward</h3>
              <p style="font-size: 18px; font-weight: bold; color: #007bff;">${rewardText}</p>
              <p>${reward.description}</p>
            </div>
            <p>Keep sharing! Refer more friends and earn additional rewards.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://autosalonani.com/referrals"
                 style="background: #28a745; color: white; padding: 15px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                View My Referrals
              </a>
            </div>
          </div>
        `,
      });

      logger.info('Referral success email sent', { referrerId: referrer.id });
    } catch (error) {
      logger.error('Failed to send referral success email', { referrerId: referrer.id }, error as Error);
    }
  }

  /**
   * Expire old referrals
   */
  static async expireOldReferrals() {
    try {
      const result = await prisma.referral.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          status: 'PENDING',
        },
        data: { status: 'EXPIRED' },
      });

      logger.info('Expired old referrals', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to expire old referrals', {}, error as Error);
      throw error;
    }
  }

  /**
   * Generate shareable referral link for lead
   */
  static async getShareableLink(leadId: string) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Create a general referral code for the lead (reusable)
      let existingReferral = await prisma.referral.findFirst({
        where: {
          referrerId: leadId,
          referredEmail: '', // Empty email means this is a general referral link
        },
      });

      if (!existingReferral) {
        const referralCode = ReferralProgram.generateReferralCode(lead.email);

        existingReferral = await prisma.referral.create({
          data: {
            referrerId: leadId,
            referredEmail: '', // General referral link
            referralCode,
            status: 'PENDING',
          },
        });
      }

      const referralLink = `https://autosalonani.com?ref=${existingReferral.referralCode}`;

      return {
        referralCode: existingReferral.referralCode,
        referralLink,
        shareableText: `Check out AUTO ANI for amazing vehicles! Use my referral link: ${referralLink}`,
      };
    } catch (error) {
      logger.error('Failed to get shareable link', { leadId }, error as Error);
      throw error;
    }
  }
}