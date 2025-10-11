// SMS Integration Service using Twilio with Fallback Support
import twilio from 'twilio';
import envValidator from '../config/env-validator';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+38349204242';

// Initialize Twilio client only if valid credentials are provided
const client = envValidator.hasSMSService()
  ? twilio(accountSid!, authToken!)
  : null;

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSOptions) {
  // Validate phone number format (Kosovo numbers)
  const phoneRegex = /^\+383\d{8,9}$/;
  if (!phoneRegex.test(to)) {
    console.error('Invalid Kosovo phone number format:', to);
    return { success: false, error: 'Invalid phone number format' };
  }

  // Fallback mode when SMS service is not configured
  if (!envValidator.hasSMSService()) {
    console.log('📱 SMS service not configured. Message logged:', { to, message });
    // In production without SMS service, save to database for manual processing
    if (process.env.NODE_ENV === 'production') {
      // TODO: Save SMS to database queue for manual sending via WhatsApp
      console.error('Warning: SMS service not configured in production. Consider WhatsApp integration.');
    }
    return { success: true, sid: 'fallback-sms-id', fallback: true };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📱 SMS (dev mode):', { to, message });
    return { success: true, sid: 'dev-sms-id' };
  }

  try {
    const result = await client!.messages.create({
      body: message,
      from: fromNumber,
      to
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// SMS templates
export const smsTemplates = {
  appointmentReminder: (data: { name: string; date: string; time: string }) =>
    `AUTO ANI Reminder: Hi ${data.name}, your appointment is scheduled for ${data.date} at ${data.time}. Call +38349204242 if you need to reschedule.`,

  vehicleAvailable: (data: { make: string; model: string; year: number }) =>
    `AUTO ANI: The ${data.year} ${data.make} ${data.model} you inquired about is still available. Visit us or call +38349204242 for more info.`,

  testDriveConfirmation: (data: { name: string; vehicle: string; date: string; time: string }) =>
    `AUTO ANI: ${data.name}, your test drive for ${data.vehicle} is confirmed for ${data.date} at ${data.time}. See you soon!`,

  serviceReminder: (data: { name: string; service: string; nextDate: string }) =>
    `AUTO ANI: Hi ${data.name}, your vehicle is due for ${data.service} on ${data.nextDate}. Call +38349204242 to schedule.`,

  promotionalOffer: (data: { offer: string; validUntil: string }) =>
    `AUTO ANI Special Offer: ${data.offer}. Valid until ${data.validUntil}. Visit autosalonani.com or call +38349204242.`
};

// Bulk SMS functionality
export async function sendBulkSMS(recipients: { to: string; message: string }[]) {
  const results = await Promise.allSettled(
    recipients.map(({ to, message }) => sendSMS({ to, message }))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  return {
    total: recipients.length,
    successful,
    failed,
    results
  };
}