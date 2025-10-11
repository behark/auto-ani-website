// Email service utilities for AUTO ANI Website using Resend
import { ResendEmailService } from '@/lib/integrations/resend';
import { env } from './env';

// Default email configuration
const DEFAULT_FROM = env.FROM_EMAIL;
const ADMIN_EMAIL = env.ADMIN_EMAIL;

// Email template helpers
export const EmailTemplates = {
  // Contact form notification to admin
  contactFormNotification: (data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    subject?: string;
    submittedAt: string;
  }) => ({
    subject: `New Contact Form Submission - ${data.subject || 'General Inquiry'}`,
    html: `
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
          <p><strong>Submitted:</strong> ${data.submittedAt}</p>
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

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="color: #9ca3af; font-size: 12px;">
          This email was sent from the AUTO ANI website contact form.
        </p>
      </div>
    `
  }),

  // Other email templates...
};

// Send email function using Resend service
export async function sendEmail(options: {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    const result = await ResendEmailService.sendEmail({
      to: options.to,
      from: options.from || DEFAULT_FROM,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Email send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Send contact form email using Resend
export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
}) {
  return ResendEmailService.sendContactFormNotification(data);
}

export async function sendVehicleInquiryNotification(data: {
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
}) {
  return ResendEmailService.sendVehicleInquiryNotification(data);
}

// Send custom email for marketing campaigns
export async function sendCustomEmail(data: {
  to: string | string[];
  subject: string;
  content: string;
  htmlContent?: string;
}) {
  return ResendEmailService.sendEmail({
    to: data.to,
    subject: data.subject,
    html: data.htmlContent || data.content,
    text: data.content,
  });
}

export const EmailService = {
  sendEmail,
  sendContactFormEmail,
  sendVehicleInquiryNotification,
  sendCustomEmail,
  sendMarketingEmail: sendEmail, // Alias for marketing emails
};

export default EmailService;