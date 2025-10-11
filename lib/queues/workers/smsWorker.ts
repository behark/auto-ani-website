// SMS Worker for Marketing Automation
// Processes SMS jobs from the queue using Twilio

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
namespace Bull {
  export interface Job<T = any> {
    id: string;
    data: T;
    progress(value: number): void;
  }
}
import { SMSService } from '@/lib/sms';
import { prisma } from '@/lib/database';
import { smsQueue, JOB_TYPES } from '../marketingQueue';

interface SMSJobData {
  to: string;
  message: string;
  mediaUrls?: string[];
  customerId?: string;
  campaignId?: string;
  personalizationData?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
  workflowContext?: Record<string, unknown>;
  senderName?: string;
}

interface SMSCampaignJobData {
  campaignId: string;
  batchSize?: number;
  startIndex?: number;
}

/**
 * Process individual SMS jobs
 */
smsQueue.process(JOB_TYPES.SEND_SINGLE_SMS, 3, async (job: Bull.Job<SMSJobData>) => {
  const { data } = job;
  console.log(`Processing single SMS job: ${job.id}`, { to: data.to, message: data.message.substring(0, 50) });

  try {
    // Personalize SMS content if personalization data is provided
    let personalizedMessage = data.message;

    if (data.personalizationData) {
      personalizedMessage = personalizeContent(data.message, data.personalizationData);
    }

    // Check if recipient has opted out
    const isOptedOut = await checkSMSOptOut(data.to);
    if (isOptedOut) {
      console.log(`Skipping SMS to opted-out recipient: ${data.to}`);

      // Log as skipped
      if (data.campaignId) {
        await logSMSDelivery({
          campaignId: data.campaignId,
          customerId: data.customerId,
          phoneNumber: data.to,
          message: personalizedMessage,
          status: 'SKIPPED',
          skipReason: 'opted_out',
          workflowContext: data.workflowContext
        });
      }

      return {
        success: false,
        reason: 'opted_out',
        to: data.to,
        skippedAt: new Date().toISOString()
      };
    }

    // Send SMS using Twilio service
    const result = await SMSService.sendSMS({
      to: data.to,
      message: personalizedMessage,
      mediaUrls: data.mediaUrls,
      senderName: data.senderName,
      deliveryReceipts: true
    });

    // Log SMS delivery
    if (data.campaignId) {
      await logSMSDelivery({
        campaignId: data.campaignId,
        customerId: data.customerId,
        phoneNumber: data.to,
        message: personalizedMessage,
        status: 'SENT',
        messageId: result.messageId,
        cost: result.cost ?? undefined,
        segments: typeof result.segments === 'number' ? result.segments : undefined,
        workflowContext: data.workflowContext
      });
    }

    console.log(`SMS sent successfully to ${data.to}`, { messageId: result.messageId, cost: result.cost });

    return {
      success: true,
      messageId: result.messageId,
      to: data.to,
      cost: result.cost,
      segments: result.segments,
      sentAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Failed to send SMS to ${data.to}:`, error);

    // Log failed delivery
    if (data.campaignId) {
      await logSMSDelivery({
        campaignId: data.campaignId,
        customerId: data.customerId,
        phoneNumber: data.to,
        message: data.message,
        status: 'FAILED',
        errorMessage: (error as Error).message,
        workflowContext: data.workflowContext
      });
    }

    throw error;
  }
});

/**
 * Process SMS campaign jobs
 */
smsQueue.process(JOB_TYPES.SEND_SMS_CAMPAIGN, 1, async (job: Bull.Job<SMSCampaignJobData>) => {
  const { data } = job;
  console.log(`Processing SMS campaign job: ${job.id}`, { campaignId: data.campaignId });

  try {
    // Get campaign details
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id: data.campaignId },
      include: {
        campaign: true
      }
    });

    if (!campaign) {
      throw new Error(`SMS campaign ${data.campaignId} not found`);
    }

    if (campaign.status !== 'SCHEDULED' && campaign.status !== 'SENDING') {
      throw new Error(`Campaign ${data.campaignId} is not in sendable status: ${campaign.status}`);
    }

    // Mark campaign as sending
    if (campaign.status === 'SCHEDULED') {
      await prisma.smsCampaign.update({
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
      await prisma.smsCampaign.update({
        where: { id: data.campaignId },
        data: { status: 'SENT' }
      });
      return { success: true, recipientCount: 0 };
    }

    const batchSize = data.batchSize || 50; // Smaller batches for SMS
    const startIndex = data.startIndex || 0;
    const endIndex = Math.min(startIndex + batchSize, recipients.length);
    const batch = recipients.slice(startIndex, endIndex);

    console.log(`Processing SMS batch ${startIndex}-${endIndex} of ${recipients.length} recipients`);

    // Process batch of recipients
    const smsPromises = batch.map(async (recipient) => {
      try {
        // Personalize content for this recipient
        const personalizedMessage = personalizeContent(campaign.message, recipient);

        // Queue individual SMS with rate limiting
        await smsQueue.add(JOB_TYPES.SEND_SINGLE_SMS, {
          to: recipient.phone,
          message: personalizedMessage,
          mediaUrls: campaign.mediaUrls,
          customerId: recipient.customerId,
          campaignId: data.campaignId,
          personalizationData: recipient,
          senderName: campaign.senderName
        }, {
          priority: 2, // Normal priority for campaign SMS
          delay: Math.random() * 2000 + 1000 // Random delay 1-3 seconds for rate limiting
        });

        return { success: true, phone: recipient.phone };

      } catch (error) {
        console.error(`Failed to queue SMS for ${recipient.phone}:`, error);
        return { success: false, phone: recipient.phone, error: (error as Error).message };
      }
    });

    const results = await Promise.allSettled(smsPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Update campaign metrics
    await prisma.smsCampaign.update({
      where: { id: data.campaignId },
      data: {
        sent: { increment: successful }
      }
    });

    // Schedule next batch if there are more recipients
    if (endIndex < recipients.length) {
      await smsQueue.add(JOB_TYPES.SEND_SMS_CAMPAIGN, {
        campaignId: data.campaignId,
        batchSize,
        startIndex: endIndex
      }, {
        delay: 60000 // 1 minute delay between batches for rate limiting
      });
    } else {
      // Mark campaign as sent
      await prisma.smsCampaign.update({
        where: { id: data.campaignId },
        data: { status: 'SENT' }
      });
    }

    console.log(`Processed SMS batch for campaign ${data.campaignId}: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      batchProcessed: batch.length,
      successful,
      failed,
      hasMoreBatches: endIndex < recipients.length
    };

  } catch (error) {
    console.error(`Failed to process SMS campaign ${data.campaignId}:`, error);

    // Mark campaign as failed
    await prisma.smsCampaign.update({
      where: { id: data.campaignId },
      data: { status: 'FAILED' }
    });

    throw error;
  }
});

/**
 * Process SMS delivery status updates
 */
smsQueue.process('process_sms_status', 10, async (job: Bull.Job<any>) => {
  const { data } = job;
  console.log(`Processing SMS status update: ${job.id}`, data);

  try {
    // Update SMS log status
    await prisma.smsLog.updateMany({
      where: {
        messageId: data.messageId,
        phoneNumber: data.phoneNumber
      },
      data: {
        status: data.status,
        deliveredAt: data.status === 'DELIVERED' ? new Date() : undefined,
        failedAt: data.status === 'FAILED' ? new Date() : undefined,
        errorMessage: data.errorMessage
      }
    });

    // Update campaign metrics
    if (data.campaignId) {
      const updateData: Record<string, unknown> = {};

      switch (data.status) {
        case 'DELIVERED':
          updateData.delivered = { increment: 1 };
          break;
        case 'FAILED':
        case 'UNDELIVERED':
          updateData.failed = { increment: 1 };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.smsCampaign.update({
          where: { id: data.campaignId },
          data: updateData
        });
      }
    }

    return { success: true, processed: 'status_update' };

  } catch (error) {
    console.error('Failed to process SMS status update:', error);
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
          customer: {
            where: {
              smsOptIn: true,
              phone: { not: null }
            }
          }
        }
      });

      recipients.push(...segmentMembers
        .filter((m: any) => m.customer)
        .map((m: any) => ({
          customerId: m.customerId,
          phone: m.customer.phone,
          firstName: m.customer.firstName,
          lastName: m.customer.lastName,
          ...m.customer
        }))
      );

    } else if (campaign.customAudience) {
      // Get recipients based on custom audience criteria
      console.log('Custom audience targeting not yet implemented for SMS');

    } else {
      // Get all active customers with SMS opt-in
      const customers = await prisma.customer.findMany({
        where: {
          isActive: true,
          smsOptIn: true,
          phone: { not: null }
        }
      });

      recipients.push(...customers.map((c: any) => ({
        customerId: c.id,
        phone: c.phone,
        firstName: c.firstName,
        lastName: c.lastName,
        ...c
      })));
    }

    console.log(`Found ${recipients.length} SMS recipients for campaign ${campaign.id}`);
    return recipients;

  } catch (error) {
    console.error('Error getting SMS campaign recipients:', error);
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
  const tokens = {
    '{{firstName}}': recipientData.firstName || '',
    '{{lastName}}': recipientData.lastName || '',
    '{{fullName}}': `${recipientData.firstName || ''} ${recipientData.lastName || ''}`.trim(),
    '{{phone}}': recipientData.phone || '',
    '{{customerName}}': recipientData.firstName || 'Customer',
    '{{dealershipName}}': 'AUTO ANI',
    '{{dealershipPhone}}': '+383 49 204 242',
    '{{siteUrl}}': process.env.NEXT_PUBLIC_SITE_URL || 'autosalonani.com',
    '{{currentYear}}': new Date().getFullYear().toString(),
    '{{stopText}}': 'Reply STOP to opt out'
  };

  // Replace all tokens
  Object.entries(tokens).forEach(([token, value]) => {
    personalizedContent = personalizedContent.replace(new RegExp(token, 'g'), value);
  });

  return personalizedContent;
}

/**
 * Check if phone number has opted out of SMS
 */
async function checkSMSOptOut(phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    const customer = await prisma.customer.findFirst({
      where: {
        phone: formattedPhone,
        smsOptIn: false
      }
    });

    return !!customer;

  } catch (error) {
    console.error('Error checking SMS opt-out status:', error);
    return false; // Default to allowing send if check fails
  }
}

/**
 * Log SMS delivery for tracking
 */
async function logSMSDelivery(data: {
  campaignId?: string;
  customerId?: string;
  phoneNumber: string;
  message: string;
  status: string;
  messageId?: string;
  cost?: number;
  segments?: number;
  errorMessage?: string;
  skipReason?: string;
  workflowContext?: Record<string, unknown>;
}): Promise<void> {
  try {
    if (data.campaignId) {
      await prisma.smsLog.create({
        data: {
          smsCampaignId: data.campaignId,
          customerId: data.customerId,
          phoneNumber: data.phoneNumber,
          message: data.message,
          status: data.status as 'SENT' | 'FAILED' | 'DELIVERED' | 'UNDELIVERED' | 'SKIPPED',
          messageId: data.messageId,
          cost: data.cost,
          segments: data.segments,
          errorMessage: data.errorMessage,
          sentAt: new Date()
        }
      });
    }

    console.log(`Logged SMS delivery: ${data.phoneNumber} - ${data.status}`);

  } catch (error) {
    console.error('Failed to log SMS delivery:', error);
  }
}

// Error handling
smsQueue.on('failed', (job: Bull.Job, error: Error) => {
  console.error(`SMS job ${job.id} failed:`, error);
});

smsQueue.on('completed', (job: Bull.Job, result: any) => {
  console.log(`SMS job ${job.id} completed:`, result);
});

console.log('SMS worker started');

export default smsQueue;