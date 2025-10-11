/**
 * Email Marketing Automation for AUTO ANI
 * Manages email campaigns, drip sequences, and nurture workflows
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { logger } from '@/lib/logger';

export interface EmailCampaignData {
  name: string;
  subject: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  htmlContent: string;
  textContent?: string;
  campaignType: 'NEWSLETTER' | 'DRIP' | 'PROMOTIONAL' | 'TRANSACTIONAL' | 'NURTURE';
  segmentCriteria?: Record<string, any>;
  scheduledAt?: Date;
  isABTest?: boolean;
  language?: string;
}

export interface DripCampaignConfig {
  name: string;
  description?: string;
  trigger: 'SIGNUP' | 'INQUIRY' | 'DOWNLOAD' | 'VEHICLE_VIEW';
  emails: DripEmailConfig[];
}

export interface DripEmailConfig {
  delayDays: number;
  subject: string;
  content: string;
  contentHtml: string;
}

export class EmailAutomationEngine {
  /**
   * Create email campaign
   */
  static async createCampaign(data: EmailCampaignData) {
    try {
      const campaign = await prisma.emailCampaign.create({
        data: {
          name: data.name,
          language: data.language || 'sq',
          subject: data.subject,
          previewText: data.previewText,
          content: data.textContent || '',
          contentHtml: data.htmlContent,
          segmentCriteria: data.segmentCriteria ? JSON.stringify(data.segmentCriteria) : undefined,
          status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledFor: data.scheduledAt,
        },
      });

      logger.info('Email campaign created', { campaignId: campaign.id, name: campaign.name });
      return campaign;
    } catch (error) {
      logger.error('Failed to create email campaign', { data }, error as Error);
      throw error;
    }
  }

  /**
   * Send campaign to lead segment
   */
  static async sendCampaign(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status === 'SENT') {
        throw new Error('Campaign already sent');
      }

      // Get targeted leads
      const leads = await this.getLeadsForCampaign(campaign);

      logger.info('Sending campaign', {
        campaignId,
        recipientCount: leads.length,
      });

      // Create subscriptions for tracking
      const subscriptions = await Promise.all(
        leads.map((lead: any) =>
          prisma.leadCampaignSubscription.create({
            data: {
              campaignId,
              leadId: lead.id,
              status: 'PENDING',
            },
          })
        )
      );

      // Update campaign status
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENDING',
          sentAt: new Date(),
          recipientCount: leads.length,
        },
      });

      // Send emails (in batches)
      const batchSize = 100;
      let sent = 0;
      let delivered = 0;
      let bounced = 0;

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (lead: any, index: any) => {
            const subscription = subscriptions[i + index];
            try {
              await EmailService.sendMarketingEmail({
                to: lead.email,
                subject: campaign.subject,
                html: this.personalizeContent(campaign.contentHtml, lead),
                text: this.personalizeContent(campaign.content, lead),
              });

              await prisma.leadCampaignSubscription.update({
                where: { id: subscription.id },
                data: {
                  status: 'SENT',
                  sentAt: new Date(),
                },
              });

              sent++;
              delivered++;
            } catch (error) {
              logger.error('Failed to send campaign email', {
                campaignId,
                leadId: lead.id,
              }, error as Error);

              await prisma.leadCampaignSubscription.update({
                where: { id: subscription.id },
                data: {
                  status: 'BOUNCED',
                  bouncedAt: new Date(),
                },
              });

              bounced++;
            }
          })
        );
      }

      // Update campaign final status
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          totalSent: sent,
          totalDelivered: delivered,
          totalBounced: bounced,
        },
      });

      logger.info('Campaign sent successfully', {
        campaignId,
        sent,
        delivered,
        bounced,
      });

      return { sent, delivered, bounced };
    } catch (error) {
      logger.error('Failed to send campaign', { campaignId }, error as Error);

      // Update campaign to failed state
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Get leads matching campaign criteria
   */
  private static async getLeadsForCampaign(campaign: any) {
    const criteria = campaign.segmentCriteria
      ? JSON.parse(campaign.segmentCriteria)
      : {};

    const where: any = {
      emailVerified: true,
    };

    if (criteria.temperature) {
      where.temperature = criteria.temperature;
    }

    if (criteria.status) {
      where.status = Array.isArray(criteria.status)
        ? { in: criteria.status }
        : criteria.status;
    }

    if (criteria.minScore) {
      where.score = { gte: criteria.minScore };
    }

    if (criteria.source) {
      where.source = Array.isArray(criteria.source)
        ? { in: criteria.source }
        : criteria.source;
    }

    if (criteria.hasActivity) {
      where.activities = {
        some: {
          activityType: criteria.hasActivity,
        },
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        score: true,
        temperature: true,
      },
    });

    return leads;
  }

  /**
   * Personalize email content with lead data
   */
  private static personalizeContent(content: string, lead: any): string {
    let personalized = content;

    // Replace placeholders
    personalized = personalized.replace(/\{\{firstName\}\}/g, lead.firstName || '');
    personalized = personalized.replace(/\{\{lastName\}\}/g, lead.lastName || '');
    personalized = personalized.replace(/\{\{email\}\}/g, lead.email || '');
    personalized = personalized.replace(/\{\{name\}\}/g,
      `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'valued customer'
    );

    return personalized;
  }

  /**
   * Track email open
   */
  static async trackEmailOpen(subscriptionId: string) {
    try {
      const subscription = await prisma.leadCampaignSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        logger.warn('Subscription not found for open tracking', { subscriptionId });
        return;
      }

      await prisma.leadCampaignSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'OPENED',
          openedAt: subscription.openedAt || new Date(),
          openCount: { increment: 1 },
        },
      });

      // Update campaign stats
      await this.updateCampaignStats(subscription.campaignId);

      // Track lead activity
      const { LeadScoringEngine } = await import('./LeadScoringEngine');
      await LeadScoringEngine.trackActivity(subscription.leadId, {
        activityType: 'EMAIL_OPEN',
        description: 'Opened marketing email',
        metadata: { subscriptionId, campaignId: subscription.campaignId },
      });

      logger.info('Email open tracked', { subscriptionId, leadId: subscription.leadId });
    } catch (error) {
      logger.error('Failed to track email open', { subscriptionId }, error as Error);
    }
  }

  /**
   * Track email click
   */
  static async trackEmailClick(subscriptionId: string, url: string) {
    try {
      const subscription = await prisma.leadCampaignSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        logger.warn('Subscription not found for click tracking', { subscriptionId });
        return;
      }

      await prisma.leadCampaignSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CLICKED',
          clickedAt: subscription.clickedAt || new Date(),
          clickCount: { increment: 1 },
        },
      });

      // Update campaign stats
      await this.updateCampaignStats(subscription.campaignId);

      // Track lead activity
      const { LeadScoringEngine } = await import('./LeadScoringEngine');
      await LeadScoringEngine.trackActivity(subscription.leadId, {
        activityType: 'EMAIL_CLICK',
        description: `Clicked link in email: ${url}`,
        metadata: { subscriptionId, campaignId: subscription.campaignId, url },
      });

      logger.info('Email click tracked', { subscriptionId, leadId: subscription.leadId, url });
    } catch (error) {
      logger.error('Failed to track email click', { subscriptionId }, error as Error);
    }
  }

  /**
   * Track email unsubscribe
   */
  static async trackEmailUnsubscribe(subscriptionId: string) {
    try {
      const subscription = await prisma.leadCampaignSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        logger.warn('Subscription not found for unsubscribe tracking', { subscriptionId });
        return;
      }

      await prisma.leadCampaignSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribedAt: new Date(),
        },
      });

      // Update campaign stats
      await this.updateCampaignStats(subscription.campaignId);

      // Update lead status
      await prisma.lead.update({
        where: { id: subscription.leadId },
        data: {
          status: 'COLD',
        },
      });

      logger.info('Email unsubscribe tracked', { subscriptionId, leadId: subscription.leadId });
    } catch (error) {
      logger.error('Failed to track email unsubscribe', { subscriptionId }, error as Error);
    }
  }

  /**
   * Update campaign statistics
   */
  private static async updateCampaignStats(campaignId: string) {
    try {
      const stats = await prisma.leadCampaignSubscription.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: true,
      });

      const statsMap = stats.reduce((acc: any, stat: any) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>);

      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          totalOpened: statsMap['OPENED'] || 0,
          totalClicked: statsMap['CLICKED'] || 0,
          totalBounced: statsMap['BOUNCED'] || 0,
          totalUnsubscribed: statsMap['UNSUBSCRIBED'] || 0,
        },
      });
    } catch (error) {
      logger.error('Failed to update campaign stats', { campaignId }, error as Error);
    }
  }

  /**
   * Create drip campaign workflow
   */
  static async createDripCampaign(config: DripCampaignConfig) {
    try {
      const workflow = await prisma.automationWorkflow.create({
        data: {
          name: config.name,
          description: config.description,
          workflowType: 'NURTURE',
          trigger: config.trigger,
          triggerConfig: JSON.stringify({
            trigger: config.trigger,
          }),
          actions: JSON.stringify(
            config.emails.map((email, index) => ({
              type: 'SEND_EMAIL',
              delay: email.delayDays * 24 * 60 * 60 * 1000, // Convert days to milliseconds
              subject: email.subject,
              content: email.content,
              contentHtml: email.contentHtml,
              order: index,
            }))
          ),
          isActive: true,
        },
      });

      logger.info('Drip campaign created', {
        workflowId: workflow.id,
        name: config.name,
        emailCount: config.emails.length,
      });

      return workflow;
    } catch (error) {
      logger.error('Failed to create drip campaign', { config }, error as Error);
      throw error;
    }
  }

  /**
   * Get campaign performance
   */
  static async getCampaignPerformance(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          emails: {
            select: {
              status: true,
              openedAt: true,
              clickedAt: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      const totalSent = campaign.totalSent || 0;
      const openRate = totalSent > 0 ? (campaign.totalOpened / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (campaign.totalClicked / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (campaign.totalBounced / totalSent) * 100 : 0;
      const unsubscribeRate = totalSent > 0 ? (campaign.totalUnsubscribed / totalSent) * 100 : 0;

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          sentAt: campaign.sentAt,
        },
        metrics: {
          totalSent,
          totalDelivered: campaign.totalDelivered || 0,
          totalOpened: campaign.totalOpened || 0,
          totalClicked: campaign.totalClicked || 0,
          totalBounced: campaign.totalBounced || 0,
          totalUnsubscribed: campaign.totalUnsubscribed || 0,
          openRate: openRate.toFixed(2),
          clickRate: clickRate.toFixed(2),
          bounceRate: bounceRate.toFixed(2),
          unsubscribeRate: unsubscribeRate.toFixed(2),
        },
      };
    } catch (error) {
      logger.error('Failed to get campaign performance', { campaignId }, error as Error);
      throw error;
    }
  }

  /**
   * Pre-built welcome email sequence
   */
  static async createWelcomeSequence() {
    return await this.createDripCampaign({
      name: 'Welcome Sequence',
      description: 'Automated welcome emails for new leads',
      trigger: 'SIGNUP',
      emails: [
        {
          delayDays: 0,
          subject: 'Welcome to AUTO ANI - Your Automotive Journey Starts Here',
          content: 'Welcome to AUTO ANI! We are excited to help you find your perfect vehicle.',
          contentHtml: `
            <h1>Welcome to AUTO ANI, {{firstName}}!</h1>
            <p>Thank you for your interest in our vehicles. We're here to help you find the perfect car.</p>
            <p>Browse our latest inventory and don't hesitate to reach out if you have questions.</p>
            <a href="https://autosalonani.com/vehicles">View Our Vehicles</a>
          `,
        },
        {
          delayDays: 3,
          subject: 'How Can We Help You Find Your Perfect Vehicle?',
          content: 'We noticed you signed up a few days ago. Are you looking for anything specific?',
          contentHtml: `
            <h2>Hi {{firstName}},</h2>
            <p>We wanted to check in and see if there's anything we can help you with.</p>
            <p>Our team is ready to answer any questions about our vehicles, financing options, or trade-ins.</p>
            <a href="https://autosalonani.com/contact">Contact Us</a>
          `,
        },
        {
          delayDays: 7,
          subject: 'Special Offers Just for You',
          content: 'Check out our current promotions and special financing offers.',
          contentHtml: `
            <h2>Exclusive Offers for You, {{firstName}}</h2>
            <p>We have some great deals this week that you won't want to miss!</p>
            <ul>
              <li>Special financing rates</li>
              <li>Trade-in bonuses</li>
              <li>Extended warranties available</li>
            </ul>
            <a href="https://autosalonani.com/vehicles">Shop Now</a>
          `,
        },
      ],
    });
  }

  /**
   * Pre-built abandoned inquiry follow-up
   */
  static async createAbandonedInquirySequence() {
    return await this.createDripCampaign({
      name: 'Abandoned Inquiry Follow-up',
      description: 'Follow up with leads who started but did not complete an inquiry',
      trigger: 'INQUIRY',
      emails: [
        {
          delayDays: 1,
          subject: 'Did you have questions about this vehicle?',
          content: 'We noticed you were interested in one of our vehicles. Can we help?',
          contentHtml: `
            <h2>Hi {{firstName}},</h2>
            <p>We saw that you were looking at one of our vehicles. Do you have any questions?</p>
            <p>Our team is standing by to provide more information, schedule a test drive, or discuss financing options.</p>
            <a href="https://autosalonani.com/contact">Get in Touch</a>
          `,
        },
        {
          delayDays: 3,
          subject: 'This vehicle is still available - Act fast!',
          content: 'The vehicle you were interested in is still available, but it will not last long.',
          contentHtml: `
            <h2>Don't Miss Out, {{firstName}}!</h2>
            <p>The vehicle you were looking at is still available, but our inventory moves fast.</p>
            <p>Schedule a test drive today before someone else takes it home.</p>
            <a href="https://autosalonani.com/appointments">Schedule Test Drive</a>
          `,
        },
      ],
    });
  }
}