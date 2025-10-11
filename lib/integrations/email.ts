// Email Integration Service using Resend with Fallback Support
import { Resend } from 'resend';
import { env, isEmailServiceConfigured } from '../env';

// Initialize Resend only if valid API key is available
const resend = isEmailServiceConfigured()
  ? new Resend(env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = env.FROM_EMAIL,
  replyTo
}: EmailOptions) {
  // Fallback mode when email service is not configured
  if (!isEmailServiceConfigured()) {
    console.log('📧 Email service not configured. Message logged:', { to, subject });
    // In production without email service, save to database for manual processing
    if (env.NODE_ENV === 'production') {
      // TODO: Save email to database queue for manual sending
      console.error('Warning: Email service not configured in production');
    }
    return { success: true, id: 'fallback-email-id', fallback: true };
  }

  if (env.NODE_ENV === 'development') {
    console.log('📧 Email (dev mode):', { to, subject });
    return { success: true, id: 'dev-email-id' };
  }

  try {
    const data = await resend!.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: replyTo
    });

    return { success: true, id: (data as any).id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email templates
export const emailTemplates = {
  contactForm: (data: { name: string; email: string; message: string; vehicleId?: string }) => ({
    subject: `New Contact Form Submission from ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.vehicleId ? `<p><strong>Vehicle ID:</strong> ${data.vehicleId}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 3px;">${data.message}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent from the AUTO ANI website contact form.
        </p>
      </div>
    `
  }),

  appointmentConfirmation: (data: { name: string; date: string; time: string; service: string }) => ({
    subject: `Appointment Confirmation - ${data.date} at ${data.time}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Appointment Confirmed</h2>
        <p>Dear ${data.name},</p>
        <p>Your appointment has been confirmed for:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Service:</strong> ${data.service}</p>
        </div>
        <p>Location: AUTO ANI, Gazmend Baliu, Mitrovicë, Kosovë</p>
        <p>If you need to reschedule or cancel, please call us at +38349204242.</p>
        <p style="margin-top: 30px;">Best regards,<br>AUTO ANI Team</p>
      </div>
    `
  }),

  vehicleInquiry: (data: {
    name: string;
    email: string;
    phone?: string;
    vehicle: { make: string; model: string; year: number; price: number }
  }) => ({
    subject: `Vehicle Inquiry - ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Vehicle Inquiry</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <h3>Customer Information:</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}

          <h3>Vehicle Details:</h3>
          <p><strong>Vehicle:</strong> ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</p>
          <p><strong>Price:</strong> €${data.vehicle.price.toLocaleString()}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Respond to this inquiry as soon as possible.
        </p>
      </div>
    `
  })
};