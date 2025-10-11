// Email Worker for Marketing Automation
// Processes email jobs from the queue

// TODO: Install bull package when queue functionality is needed
// import Bull from 'bull';

// Temporary stub
const Bull = {
  Job: class Job<T = any> {
    id = 'mock-job-id';
    data: T = {} as T;
    progress(value: number) {}
  }
};

// Add namespace stub
namespace Bull {
  export interface Job {
    id: string;
    data: any;
    progress(value: number): void;
  }
}
import { EmailService } from '@/lib/email';
import { prisma } from '@/lib/database';
import { emailQueue, JOB_TYPES } from '../marketingQueue';

interface EmailJobData {
  to: string;
  subject: string;
  content: string;
  htmlContent?: string;
  customerId?: string;
  campaignId?: string;
  templateId?: string;
  personalizationData?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
  workflowContext?: Record<string, unknown>;
}

interface EmailCampaignJobData {
  campaignId: string;
  batchSize?: number;
  startIndex?: number;
}

/**
 * Process individual email jobs
 */
emailQueue.process(JOB_TYPES.SEND_SINGLE_EMAIL, 5, async (job: any) => {
  const { data } = job;
  console.log(`Processing single email job: ${job.id}`, { to: data.to, subject: data.subject });

  try {
    // Personalize email content if personalization data is provided
    let personalizedSubject = data.subject;
    let personalizedContent = data.content;

    if (data.personalizationData) {
      personalizedSubject = personalizeContent(data.subject, data.personalizationData);
      personalizedContent = personalizeContent(data.content, data.personalizationData);
    }

    // Send email using Resend service
    const result = await EmailService.sendCustomEmail({
      to: data.to,
      subject: personalizedSubject,
      content: personalizedContent,
      htmlContent: data.htmlContent
    });

    // Log email delivery
    if (data.campaignId) {
      await logEmailDelivery({
        campaignId: data.campaignId,
        customerId: data.customerId,
        email: data.to,
        subject: personalizedSubject,
        status: 'SENT',
        messageId: (result as any).emailId || result.id,
        workflowContext: data.workflowContext
      });
    }

    console.log(`Email sent successfully to ${data.to}`, { emailId: (result as any).emailId || result.id });

    return {
      success: true,
      emailId: (result as any).emailId || result.id,
      to: data.to,
      sentAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Failed to send email to ${data.to}:`, error);

    // Log failed delivery
    if (data.campaignId) {
      await logEmailDelivery({
        campaignId: data.campaignId,
        customerId: data.customerId,
        email: data.to,
        subject: data.subject,
        status: 'FAILED',
        errorMessage: (error as Error).message,
        workflowContext: data.workflowContext
      });
    }

    throw error;
  }
});

/**
 * Process email campaign jobs
 */
emailQueue.process(JOB_TYPES.SEND_EMAIL_CAMPAIGN, 1, async (job: any) => {
  const { data } = job;
  console.log(`Processing email campaign job: ${job.id}`, { campaignId: data.campaignId });

  try {
    // Get campaign details
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: data.campaignId },
      include: {
        campaign: true
      }
    });

    if (!campaign) {
      throw new Error(`Email campaign ${data.campaignId} not found`);
    }

    if (campaign.status !== 'SCHEDULED' && campaign.status !== 'SENDING') {
      throw new Error(`Campaign ${data.campaignId} is not in sendable status: ${campaign.status}`);
    }

    // Mark campaign as sending
    if (campaign.status === 'SCHEDULED') {
      await prisma.emailCampaign.update({
        where: { id: data.campaignId },
        data: {
          status: 'SENDING',
          sentAt: new Date()
        }
      });
    }

    // Get recipient list based on campaign targeting
    const recipients = await getCampaignRecipients(campaign);

    if (recipients.length === 0) {
      await prisma.emailCampaign.update({
        where: { id: data.campaignId },
        data: { status: 'SENT' }
      });
      return { success: true, recipientCount: 0 };
    }

    const batchSize = data.batchSize || 100;
    const startIndex = data.startIndex || 0;
    const endIndex = Math.min(startIndex + batchSize, recipients.length);
    const batch = recipients.slice(startIndex, endIndex);

    console.log(`Processing batch ${startIndex}-${endIndex} of ${recipients.length} recipients`);

    // Process batch of recipients
    const emailPromises = batch.map(async (recipient) => {
      try {
        // Personalize content for this recipient
        const personalizedSubject = personalizeContent(campaign.subject, recipient);
        const personalizedContent = personalizeContent(campaign.content, recipient);

        // Queue individual email
        await emailQueue.add(JOB_TYPES.SEND_SINGLE_EMAIL, {
          to: recipient.email,
          subject: personalizedSubject,
          content: personalizedContent,
          htmlContent: campaign.htmlContent,
          customerId: recipient.customerId,
          campaignId: data.campaignId,
          personalizationData: recipient
        }, {
          priority: 2, // Normal priority for campaign emails
          delay: Math.random() * 5000 // Random delay 0-5 seconds to avoid spam filters
        });

        return { success: true, email: recipient.email };

      } catch (error) {
        console.error(`Failed to queue email for ${recipient.email}:`, error);
        return { success: false, email: recipient.email, error: (error as Error).message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Update campaign metrics
    await prisma.emailCampaign.update({
      where: { id: data.campaignId },
      data: {
        sent: { increment: successful }
      }
    });

    // Schedule next batch if there are more recipients
    if (endIndex < recipients.length) {
      await emailQueue.add(JOB_TYPES.SEND_EMAIL_CAMPAIGN, {
        campaignId: data.campaignId,
        batchSize,
        startIndex: endIndex
      }, {
        delay: 10000 // 10 second delay between batches
      });
    } else {
      // Mark campaign as sent
      await prisma.emailCampaign.update({
        where: { id: data.campaignId },
        data: { status: 'SENT' }
      });
    }

    console.log(`Processed batch for campaign ${data.campaignId}: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      batchProcessed: batch.length,
      successful,
      failed,
      hasMoreBatches: endIndex < recipients.length
    };

  } catch (error) {
    console.error(`Failed to process email campaign ${data.campaignId}:`, error);

    // Mark campaign as failed
    await prisma.emailCampaign.update({
      where: { id: data.campaignId },
      data: { status: 'FAILED' }
    });

    throw error;
  }
});

/**
 * Process email bounce notifications
 */
emailQueue.process(JOB_TYPES.PROCESS_EMAIL_BOUNCE, 10, async (job: any) => {
  const { data } = job;
  console.log(`Processing email bounce: ${job.id}`, data);

  try {
    // Update email log status
    await prisma.emailLog.updateMany({
      where: {
        messageId: data.messageId,
        email: data.email
      },
      data: {
        status: 'BOUNCED',
        bouncedAt: new Date()
      }
    });

    // Update campaign metrics
    if (data.campaignId) {
      await prisma.emailCampaign.update({
        where: { id: data.campaignId },
        data: {
          bounced: { increment: 1 }
        }
      });
    }

    // Mark email as invalid if hard bounce
    if (data.bounceType === 'permanent') {
      // In a real implementation, you'd update customer record
      // to mark email as invalid
      console.log(`Marking email as invalid: ${data.email}`);
    }

    return { success: true, processed: 'bounce' };

  } catch (error) {
    console.error('Failed to process email bounce:', error);
    throw error;
  }
});

/**
 * Get campaign recipients based on targeting criteria
 */
async function getCampaignRecipients(campaign: any): Promise<any[]> {
  const recipients: any[] = [];

  try {
    if (campaign.segmentId) {
      // Get recipients from specific segment
      const segmentMembers = await prisma.segmentMembership.findMany({
        where: {
          segmentId: campaign.segmentId,
          isActive: true
        },
        include: {
          customer: true
        }
      });

      recipients.push(...segmentMembers.map((m: any) => ({
        customerId: m.customerId,
        email: m.customer.email,
        firstName: m.customer.firstName,
        lastName: m.customer.lastName,
        ...m.customer
      })));

    } else if (campaign.customAudience) {
      // Get recipients based on custom audience criteria
      // This would implement dynamic audience building
      console.log('Custom audience targeting not yet implemented');

    } else {
      // Get all active customers
      const customers = await prisma.customer.findMany({
        where: {
          isActive: true,
          marketingOptIn: true,
          email: { not: null }
        }
      });

      recipients.push(...customers.map((c: any) => ({
        customerId: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        ...c
      })));
    }

    console.log(`Found ${recipients.length} recipients for campaign ${campaign.id}`);
    return recipients;

  } catch (error) {
    console.error('Error getting campaign recipients:', error);
    return [];
  }
}

/**
 * Personalize content with recipient data
 */
function personalizeContent(content: string, recipientData: any): string {
  if (!content || !recipientData) return content;

  let personalizedContent = content;

  // Common personalization tokens
  const tokens: Record<string, string> = {
    '{{firstName}}': String(recipientData.firstName || ''),
    '{{lastName}}': String(recipientData.lastName || ''),
    '{{fullName}}': `${recipientData.firstName || ''} ${recipientData.lastName || ''}`.trim(),
    '{{email}}': String(recipientData.email || ''),
    '{{customerName}}': String(recipientData.firstName || 'Customer'),
    '{{unsubscribeUrl}}': `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(String(recipientData.email || ''))}`,
    '{{siteUrl}}': process.env.NEXT_PUBLIC_SITE_URL || 'https://autosalonani.com',
    '{{companyName}}': 'AUTO ANI',
    '{{currentYear}}': new Date().getFullYear().toString()
  };

  // Replace all tokens
  Object.entries(tokens).forEach(([token, value]) => {
    personalizedContent = personalizedContent.replace(new RegExp(token, 'g'), value);
  });

  return personalizedContent;
}

/**
 * Log email delivery for tracking
 */
async function logEmailDelivery(data: {
  campaignId?: string;
  customerId?: string;
  email: string;
  subject: string;
  status: string;
  messageId?: string;
  errorMessage?: string;
  workflowContext?: any;
}): Promise<void> {
  try {
    if (data.campaignId) {
      await prisma.emailLog.create({
        data: {
          emailCampaignId: data.campaignId,
          customerId: data.customerId,
          email: data.email,
          subject: data.subject,
          status: data.status as 'SENT' | 'FAILED' | 'BOUNCED',
          messageId: data.messageId,
          sentAt: new Date()
        }
      });
    }

    console.log(`Logged email delivery: ${data.email} - ${data.status}`);

  } catch (error) {
    console.error('Failed to log email delivery:', error);
  }
}

// Error handling
emailQueue.on('failed', (job: Bull.Job, error: Error) => {
  console.error(`Email job ${job.id} failed:`, error);
});

emailQueue.on('completed', (job: Bull.Job, result: any) => {
  console.log(`Email job ${job.id} completed:`, result);
});

console.log('Email worker started');

export default emailQueue;