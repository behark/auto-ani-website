// Resend Email Integration for AUTO ANI
// Production-ready email service with retry logic and comprehensive error handling

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  ExternalAPIError,
  retryWithBackoff,
  Cache,
  getEnvVar,
} from '@/lib/api-utils';

// Initialize Resend client with API key validation
const resendApiKey = getEnvVar('RESEND_API_KEY');
const resend = new Resend(resendApiKey);

// Cache for email templates
const templateCache = new Cache<string>();

// Email configuration
const FROM_EMAIL = getEnvVar('FROM_EMAIL', 'contact@autosalonani.com');
const ADMIN_EMAIL = getEnvVar('ADMIN_EMAIL', 'admin@autosalonani.com');
const SITE_URL = getEnvVar('NEXT_PUBLIC_SITE_URL', 'https://autosalonani.com');

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SendTemplateEmailParams {
  to: string | string[];
  templateName: string;
  variables: Record<string, any>;
  language?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface BulkEmailParams {
  emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
    variables?: Record<string, any>;
  }>;
  batchSize?: number;
  delayMs?: number;
}

// Resend Email Service Class
export class ResendEmailService {
  /**
   * Send a single email with retry logic
   */
  static async sendEmail(params: SendEmailParams): Promise<{
    id: string;
    from: string;
    to: string | string[];
    created_at: string;
  }> {
    const {
      to,
      subject,
      html,
      text,
      from = FROM_EMAIL,
      replyTo,
      cc,
      bcc,
      tags,
      attachments,
      metadata,
    } = params;

    try {
      // Validate email addresses
      const toAddresses = Array.isArray(to) ? to : [to];
      toAddresses.forEach(email => {
        if (!this.isValidEmail(email)) {
          throw new Error(`Invalid email address: ${email}`);
        }
      });

      // Send email with retry logic
      const result = await retryWithBackoff(
        async () => {
          const response = await resend.emails.send({
            from,
            to,
            subject,
            html: html || '',
            text: text || this.htmlToText(html || ''),
            replyTo: replyTo,
            cc,
            bcc,
            tags,
            attachments: attachments?.map(att => ({
              filename: att.filename,
              content: typeof att.content === 'string'
                ? Buffer.from(att.content, 'base64')
                : att.content,
              content_type: att.contentType,
            })),
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          return response.data!;
        },
        {
          maxRetries: 3,
          shouldRetry: (error: any) => {
            // Retry on network errors or rate limits
            return (
              error.code === 'ECONNRESET' ||
              error.code === 'ETIMEDOUT' ||
              error.status === 429 ||
              error.message?.includes('rate limit')
            );
          },
          initialDelayMs: 1000,
          backoffMultiplier: 2,
        }
      );

      // Log email in database
      await this.logEmail({
        to: Array.isArray(to) ? to.join(', ') : to,
        from,
        subject,
        status: 'SENT',
        providerId: result.id,
        metadata,
      });

      // Log API call
      await this.logAPICall({
        endpoint: 'emails.send',
        success: true,
        statusCode: 200,
        requestData: { to, subject, from },
        responseData: { id: result.id },
      });

      return result as any;
    } catch (error: any) {
      console.error('Resend Email Error:', error);

      // Log failed email
      await this.logEmail({
        to: Array.isArray(to) ? to.join(', ') : to,
        from,
        subject,
        status: 'FAILED',
        errorMessage: error.message,
        metadata,
      });

      // Log failed API call
      await this.logAPICall({
        endpoint: 'emails.send',
        success: false,
        statusCode: error.status || 500,
        requestData: { to, subject, from },
        errorMessage: error.message,
      });

      throw new ExternalAPIError('Resend', error.message, {
        code: error.code,
        status: error.status,
      });
    }
  }

  /**
   * Send email using a template
   */
  static async sendTemplateEmail(params: SendTemplateEmailParams): Promise<{
    id: string;
    from: string;
    to: string | string[];
    created_at: string;
  }> {
    const {
      to,
      templateName,
      variables,
      language = 'sq',
      from = FROM_EMAIL,
      replyTo,
      tags,
    } = params;

    // Get template from database
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name: templateName,
        language,
        isActive: true,
      },
    });

    if (!template) {
      throw new Error(`Email template not found: ${templateName} (${language})`);
    }

    // Render template with variables
    const html = this.renderTemplate(template.htmlContent, variables);
    const text = template.textContent
      ? this.renderTemplate(template.textContent, variables)
      : this.htmlToText(html);
    const subject = this.renderTemplate(template.subject, variables);

    // Send email
    return this.sendEmail({
      to,
      subject,
      html,
      text,
      from: template.fromEmail || from,
      replyTo: template.replyTo || replyTo,
      tags: tags || [
        { name: 'template', value: templateName },
        { name: 'language', value: language },
      ],
      metadata: {
        templateId: template.id,
        templateName,
        variables,
      },
    });
  }

  /**
   * Send bulk emails with rate limiting
   */
  static async sendBulkEmails(params: BulkEmailParams): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      to: string;
      status: 'success' | 'failed';
      id?: string;
      error?: string;
    }>;
  }> {
    const { emails, batchSize = 10, delayMs = 1000 } = params;

    const results: Array<{
      to: string;
      status: 'success' | 'failed';
      id?: string;
      error?: string;
    }> = [];

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async (email) => {
          try {
            // Render variables if provided
            let html = email.html || '';
            let text = email.text || '';

            if (email.variables) {
              html = this.renderTemplate(html, email.variables);
              text = text ? this.renderTemplate(text, email.variables) : this.htmlToText(html);
            }

            const result = await this.sendEmail({
              to: email.to,
              subject: email.subject,
              html,
              text,
            });

            return {
              to: email.to,
              status: 'success' as const,
              id: result.id,
            };
          } catch (error: any) {
            return {
              to: email.to,
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

      // Delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return { successful, failed, results };
  }

  /**
   * Send contact form notification
   */
  static async sendContactFormNotification(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    subject?: string;
  }): Promise<any> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 15px;">Contact Details:</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>` : ''}
          ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ''}
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
          <p style="color: #6b7280; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
          <p style="color: #92400e; margin: 0;">
            <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Contact Form: ${data.subject || 'General Inquiry'}`,
      html,
      replyTo: data.email,
      tags: [
        { name: 'type', value: 'contact-form' },
        { name: 'source', value: 'website' },
      ],
      metadata: {
        type: 'contact-form',
        customerEmail: data.email,
        customerName: data.name,
      },
    });
  }

  /**
   * Send vehicle inquiry notification
   */
  static async sendVehicleInquiryNotification(data: {
    name: string;
    email: string;
    phone: string;
    message?: string;
    inquiryType: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      price: number;
      id: string;
    };
  }): Promise<any> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          New Vehicle Inquiry - ${data.inquiryType}
        </h2>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-bottom: 15px;">Vehicle Details:</h3>
          <p><strong>Vehicle:</strong> ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</p>
          <p><strong>Price:</strong> €${data.vehicle.price.toLocaleString()}</p>
          <p><strong>Vehicle ID:</strong> ${data.vehicle.id}</p>
          <p><strong>View:</strong> <a href="${SITE_URL}/vehicles/${data.vehicle.id}">Open in Admin</a></p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 15px;">Customer Details:</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
        </div>

        ${data.message ? `
        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
          <p style="color: #6b7280; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding: 15px; background-color: #dcfce7; border-radius: 8px;">
          <p style="color: #166534; margin: 0;">
            <strong>🔥 Hot Lead!</strong> Contact within 2 hours for best conversion rate.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚗 Vehicle Inquiry: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
      html,
      replyTo: data.email,
      tags: [
        { name: 'type', value: 'vehicle-inquiry' },
        { name: 'vehicle', value: data.vehicle.id },
        { name: 'inquiry-type', value: data.inquiryType },
      ],
      metadata: {
        type: 'vehicle-inquiry',
        vehicleId: data.vehicle.id,
        customerEmail: data.email,
        customerName: data.name,
        inquiryType: data.inquiryType,
      },
    });
  }

  /**
   * Send appointment confirmation
   */
  static async sendAppointmentConfirmation(data: {
    customerName: string;
    customerEmail: string;
    appointmentDate: Date;
    appointmentType: string;
    vehicle?: {
      make: string;
      model: string;
      year: number;
    };
    notes?: string;
  }): Promise<any> {
    const formattedDate = new Date(data.appointmentDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Appointment Confirmation
        </h2>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-bottom: 15px;">Appointment Details:</h3>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
          ${data.vehicle ? `
          <p><strong>Vehicle:</strong> ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</p>
          ` : ''}
        </div>

        ${data.notes ? `
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 10px;">Notes:</h3>
          <p style="color: #6b7280;">${data.notes}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <h3 style="color: #374151; margin-bottom: 15px;">What to Bring:</h3>
          <ul style="color: #6b7280; line-height: 1.8;">
            <li>Valid driver's license</li>
            <li>Proof of insurance (if applicable)</li>
            <li>Any questions you have about the vehicle</li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p style="color: #6b7280;">
            Need to reschedule? Call us at <strong>+383 49 204 242</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Appointment Confirmed - ${formattedDate}`,
      html,
      tags: [
        { name: 'type', value: 'appointment-confirmation' },
        { name: 'appointment-type', value: data.appointmentType },
      ],
      metadata: {
        type: 'appointment-confirmation',
        customerEmail: data.customerEmail,
        appointmentDate: data.appointmentDate,
        appointmentType: data.appointmentType,
      },
    });
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const emails = await prisma.emailLog.findMany({ where });

    return {
      total: emails.length,
      sent: emails.filter((e: any) => e.status === 'SENT').length,
      failed: emails.filter((e: any) => e.status === 'FAILED').length,
      opened: emails.filter((e: any) => e.openedAt).length,
      clicked: emails.filter((e: any) => e.clickedAt).length,
      bounced: emails.filter((e: any) => e.status === 'BOUNCED').length,
    };
  }

  /**
   * Validate email address
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert HTML to plain text
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Render template with variables
   */
  private static renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    // Add default variables
    const defaults = {
      currentYear: new Date().getFullYear(),
      siteUrl: SITE_URL,
      companyName: 'AUTO ANI',
      supportEmail: FROM_EMAIL,
    };

    for (const [key, value] of Object.entries(defaults)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  /**
   * Log email in database
   */
  private static async logEmail(data: {
    to: string;
    from: string;
    subject: string;
    status: string;
    providerId?: string;
    errorMessage?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          email: data.to,
          subject: data.subject,
          status: data.status as any,
          messageId: data.providerId,
          sentAt: data.status === 'SENT' ? new Date() : undefined,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
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
  }): Promise<void> {
    try {
      await prisma.aPILog.create({
        data: {
          service: 'RESEND',
          endpoint: data.endpoint,
          method: 'POST',
          requestData: data.requestData ? JSON.stringify(data.requestData) : undefined,
          responseData: data.responseData ? JSON.stringify(data.responseData) : undefined,
          statusCode: data.statusCode,
          success: data.success,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }
}

export default ResendEmailService;