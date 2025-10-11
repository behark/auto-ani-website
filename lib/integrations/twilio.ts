// Twilio SMS Integration for AUTO ANI
// Handles SMS notifications for inquiries, appointments, and updates

import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import {
  ExternalAPIError,
  retryWithBackoff,
  Cache,
  getEnvVar,
} from '@/lib/api-utils';

// Initialize Twilio client
const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
const authToken = getEnvVar('TWILIO_AUTH_TOKEN');
const fromNumber = getEnvVar('TWILIO_PHONE_NUMBER');

const twilioClient = twilio(accountSid, authToken);

// Cache for template rendering
const templateCache = new Cache<string>();

// Rate limiting configuration
const SMS_RATE_LIMIT = parseInt(process.env.SMS_RATE_LIMIT || '20'); // SMS per minute
const smsQueue: Array<() => Promise<void>> = [];
const processingQueue = false;

export interface SendSMSParams {
  to: string;
  message: string;
  vehicleId?: string;
  inquiryId?: string;
  appointmentId?: string;
  metadata?: Record<string, any>;
}

export interface SendTemplateSMSParams {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  language?: string;
  vehicleId?: string;
  inquiryId?: string;
  appointmentId?: string;
}

export interface BulkSMSParams {
  messages: Array<{
    to: string;
    message: string;
    metadata?: Record<string, any>;
  }>;
  batchSize?: number;
}

// Twilio SMS Service Class
export class TwilioService {
  /**
   * Send a single SMS
   */
  static async sendSMS(params: SendSMSParams): Promise<string> {
    const { to, message, vehicleId, inquiryId, appointmentId, metadata } = params;

    // Validate phone number format
    const cleanedNumber = this.formatPhoneNumber(to);

    try {
      // Create database record
      const smsRecord = await prisma.sMSNotification.create({
        data: {
          phoneNumber: cleanedNumber,
          message,
          status: 'PENDING',
          vehicleId,
          inquiryId,
          appointmentId,
        },
      });

      // Send SMS with retry logic
      const result = await retryWithBackoff(
        async () => {
          const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: fromNumber,
            to: cleanedNumber,
            ...(metadata && { statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/status-callback` }),
          });

          return twilioMessage;
        },
        {
          maxRetries: 3,
          shouldRetry: (error: any) => {
            // Retry on network errors or rate limits
            return (
              error.code === 'ECONNRESET' ||
              error.status === 429 ||
              error.code === 20429
            );
          },
        }
      );

      // Update database record
      await prisma.sMSNotification.update({
        where: { id: smsRecord.id },
        data: {
          status: 'SENT',
          providerId: result.sid,
          sentAt: new Date(),
        },
      });

      // Log API call
      await this.logAPICall({
        endpoint: 'messages.create',
        success: true,
        statusCode: 201,
        requestData: { to: cleanedNumber, body: message },
        responseData: { sid: result.sid, status: result.status },
      });

      return result.sid;
    } catch (error: any) {
      console.error('Twilio SMS Error:', error);

      // Update database record
      await prisma.sMSNotification.updateMany({
        where: { phoneNumber: cleanedNumber, status: 'PENDING' },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      // Log failed API call
      await this.logAPICall({
        endpoint: 'messages.create',
        success: false,
        statusCode: error.status,
        requestData: { to: cleanedNumber, body: message },
        errorMessage: error.message,
      });

      throw new ExternalAPIError('Twilio', error.message, {
        code: error.code,
        status: error.status,
      });
    }
  }

  /**
   * Send SMS using a template
   */
  static async sendTemplateSMS(params: SendTemplateSMSParams): Promise<string> {
    const {
      to,
      templateName,
      variables,
      language = 'sq',
      vehicleId,
      inquiryId,
      appointmentId,
    } = params;

    // Get template from database
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        name: templateName,
        type: 'SMS',
        language,
        isActive: true,
      },
    });

    if (!template) {
      throw new Error(`SMS template not found: ${templateName} (${language})`);
    }

    // Render template with variables
    const message = this.renderTemplate(template.message, variables);

    // Send SMS
    return this.sendSMS({
      to,
      message,
      vehicleId,
      inquiryId,
      appointmentId,
    });
  }

  /**
   * Send bulk SMS with rate limiting
   */
  static async sendBulkSMS(params: BulkSMSParams): Promise<{
    successful: number;
    failed: number;
    results: Array<{ to: string; status: 'success' | 'failed'; messageId?: string; error?: string }>;
  }> {
    const { messages, batchSize = SMS_RATE_LIMIT } = params;

    const results: Array<{
      to: string;
      status: 'success' | 'failed';
      messageId?: string;
      error?: string;
    }> = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async (msg) => {
          try {
            const messageId = await this.sendSMS({
              to: msg.to,
              message: msg.message,
              metadata: msg.metadata,
            });
            return { to: msg.to, status: 'success' as const, messageId };
          } catch (error: any) {
            return {
              to: msg.to,
              status: 'failed' as const,
              error: error.message,
            };
          }
        })
      );

      results.push(
        ...batchResults.map((result) =>
          result.status === 'fulfilled' ? result.value : result.reason
        )
      );

      // Wait 60 seconds between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return { successful, failed, results };
  }

  /**
   * Get SMS status from Twilio
   */
  static async getSMSStatus(messageSid: string): Promise<any> {
    try {
      const message = await twilioClient.messages(messageSid).fetch();

      // Update database record
      await prisma.sMSNotification.updateMany({
        where: { providerId: messageSid },
        data: {
          status: this.mapTwilioStatus(message.status),
          ...(message.status === 'delivered' && { deliveredAt: new Date() }),
        },
      });

      return message;
    } catch (error: any) {
      console.error('Twilio Get Status Error:', error);
      throw new ExternalAPIError('Twilio', error.message);
    }
  }

  /**
   * Handle Twilio status callbacks
   */
  static async handleStatusCallback(data: {
    MessageSid: string;
    MessageStatus: string;
    ErrorCode?: string;
    ErrorMessage?: string;
  }): Promise<void> {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = data;

    try {
      await prisma.sMSNotification.updateMany({
        where: { providerId: MessageSid },
        data: {
          status: this.mapTwilioStatus(MessageStatus),
          ...(MessageStatus === 'delivered' && { deliveredAt: new Date() }),
          ...(ErrorCode && { errorMessage: `${ErrorCode}: ${ErrorMessage}` }),
        },
      });

      console.log(`SMS status updated: ${MessageSid} -> ${MessageStatus}`);
    } catch (error: any) {
      console.error('Handle Status Callback Error:', error);
    }
  }

  /**
   * Send appointment reminder SMS
   */
  static async sendAppointmentReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        vehicle: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const message = `Reminder: Your appointment for ${appointment.vehicle?.make} ${appointment.vehicle?.model} is scheduled for ${new Date(appointment.appointmentDate).toLocaleString()}. See you soon! - AUTO ANI`;

    await this.sendSMS({
      to: appointment.customerPhone,
      message,
      appointmentId: appointment.id,
      vehicleId: appointment.vehicleId || undefined,
    });

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
  }

  /**
   * Send inquiry confirmation SMS
   */
  static async sendInquiryConfirmation(inquiryId: string): Promise<void> {
    const inquiry = await prisma.vehicleInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        vehicle: true,
      },
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const message = `Thank you for your inquiry about the ${inquiry.vehicle.make} ${inquiry.vehicle.model}. We'll contact you shortly! - AUTO ANI`;

    await this.sendSMS({
      to: inquiry.phone,
      message,
      inquiryId: inquiry.id,
      vehicleId: inquiry.vehicleId,
    });
  }

  /**
   * Get SMS statistics
   */
  static async getSMSStats(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    totalCost: number;
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const notifications = await prisma.sMSNotification.findMany({ where });

    return {
      total: notifications.length,
      sent: notifications.filter((n: any) => n.status === 'SENT' || n.status === 'DELIVERED').length,
      delivered: notifications.filter((n: any) => n.status === 'DELIVERED').length,
      failed: notifications.filter((n: any) => n.status === 'FAILED').length,
      pending: notifications.filter((n: any) => n.status === 'PENDING').length,
      totalCost: notifications.reduce((sum: any, n: any) => sum + (n.cost || 0), 0),
    };
  }

  /**
   * Format phone number to E.164 format
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with 383 (Kosovo), add +
    if (cleaned.startsWith('383')) {
      return `+${cleaned}`;
    }

    // If it starts with 381 (Serbia), add +
    if (cleaned.startsWith('381')) {
      return `+${cleaned}`;
    }

    // If it doesn't start with +, assume it needs country code
    if (!phoneNumber.startsWith('+')) {
      // Default to Kosovo country code
      return `+383${cleaned}`;
    }

    return phoneNumber;
  }

  /**
   * Render template with variables
   */
  private static renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  /**
   * Map Twilio status to our status
   */
  private static mapTwilioStatus(twilioStatus: string): string {
    const statusMap: Record<string, string> = {
      queued: 'PENDING',
      sending: 'PENDING',
      sent: 'SENT',
      delivered: 'DELIVERED',
      failed: 'FAILED',
      undelivered: 'FAILED',
    };

    return statusMap[twilioStatus] || 'PENDING';
  }

  /**
   * Log API call
   */
  private static async logAPICall(data: {
    endpoint: string;
    success: boolean;
    statusCode?: number;
    requestData?: any;
    responseData?: any;
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    try {
      await prisma.aPILog.create({
        data: {
          service: 'TWILIO',
          endpoint: data.endpoint,
          method: 'POST',
          requestData: data.requestData ? JSON.stringify(data.requestData) : undefined,
          responseData: data.responseData ? JSON.stringify(data.responseData) : undefined,
          statusCode: data.statusCode,
          success: data.success,
          errorMessage: data.errorMessage,
          duration: data.duration,
        },
      });
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }
}

export default TwilioService;