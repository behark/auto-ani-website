// SMS service utilities for AUTO ANI Website using Twilio
// Handles SMS sending, delivery tracking, and opt-out management

import twilio from 'twilio';
import { env, hasTwilio } from './env';

// Get Twilio client (lazy initialization)
function getTwilioClient() {
  if (!hasTwilio) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
}

// Default SMS configuration
const DEFAULT_FROM = env.TWILIO_PHONE_NUMBER || '+383491234567'; // Kosovo number format
const SMS_WEBHOOK_URL = `${env.NEXT_PUBLIC_SITE_URL}/api/marketing/sms/webhooks`;

// SMS service functions
export const SMSService = {
  // Send single SMS
  async sendSMS(data: {
    to: string;
    message: string;
    mediaUrls?: string[];
    senderName?: string;
    deliveryReceipts?: boolean;
  }) {
    try {
      const twilioClient = getTwilioClient();

      // Format phone number (ensure it starts with +)
      const formattedPhone = this.formatPhoneNumber(data.to);

      // Prepare message options
      const messageOptions: {
        body: string;
        from: string;
        to: string;
        mediaUrl?: string[];
        statusCallback?: string;
      } = {
        body: data.message,
        from: data.senderName || DEFAULT_FROM,
        to: formattedPhone
      };

      // Add media URLs if provided (MMS)
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        messageOptions.mediaUrl = data.mediaUrls;
      }

      // Enable delivery receipts
      if (data.deliveryReceipts !== false) {
        messageOptions.statusCallback = SMS_WEBHOOK_URL;
      }

      // Send SMS via Twilio
      const message = await twilioClient.messages.create(messageOptions);

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        to: formattedPhone,
        cost: message.price ? parseFloat(message.price) : null,
        segments: message.numSegments || 1
      };

    } catch (error: unknown) {
      const twilioError = error as { code?: string; message?: string; };
      console.error('SMS sending failed:', error);

      // Handle specific Twilio errors
      if (twilioError.code) {
        const errorMessage = this.getTwilioErrorMessage(parseInt(twilioError.code));
        throw new Error(`SMS failed: ${errorMessage} (${twilioError.code})`);
      }

      throw new Error('Failed to send SMS');
    }
  },

  // Send bulk SMS messages
  async sendBulkSMS(messages: Array<{
    to: string;
    message: string;
    mediaUrls?: string[];
    personalizedData?: Record<string, unknown>;
  }>) {
    try {
      const twilioClient = getTwilioClient();
      if (!twilioClient) {
        throw new Error('Twilio not configured');
      }

      const results = await Promise.allSettled(
        messages.map(msg => this.sendSMS(msg))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        totalSent: messages.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      console.error('Bulk SMS sending failed:', error);
      throw new Error('Failed to send bulk SMS');
    }
  },

  // Format phone number for international format
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Handle Kosovo numbers specifically
    if (digits.startsWith('383')) {
      return `+${digits}`;
    }

    if (digits.startsWith('49') && digits.length === 11) {
      return `+383${digits}`;
    }

    // Handle other international formats
    if (digits.startsWith('00')) {
      return `+${digits.substring(2)}`;
    }

    if (!digits.startsWith('+')) {
      // Assume Kosovo number if no country code
      if (digits.length === 8 || digits.length === 9) {
        return `+383${digits}`;
      }
    }

    return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`;
  },

  // Validate phone number format
  isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(formatted);
  },

  // Get SMS delivery status
  async getMessageStatus(messageId: string) {
    try {
      const twilioClient = getTwilioClient();
      if (!twilioClient) {
        throw new Error('Twilio not configured');
      }

      const message = await twilioClient.messages(messageId).fetch();

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price ? parseFloat(message.price) : null,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };

    } catch (error) {
      console.error('Failed to get message status:', error);
      throw new Error('Failed to get message status');
    }
  },

  // Get account balance and usage
  async getAccountInfo() {
    try {
      const twilioClient = getTwilioClient();
      if (!twilioClient) {
        throw new Error('Twilio not configured');
      }

      const [account, balance, usage] = await Promise.all([
        twilioClient.api.accounts(env.TWILIO_ACCOUNT_SID!).fetch(),
        twilioClient.api.accounts(env.TWILIO_ACCOUNT_SID!).balance.fetch(),
        twilioClient.usage.records.list({
          category: 'sms',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          endDate: new Date()
        })
      ]);

      const totalUsage = usage.reduce((sum, record) => sum + parseInt(String(record.usage || '0')), 0);
      const totalCost = usage.reduce((sum, record) => sum + parseFloat(String(record.price || '0')), 0);

      return {
        success: true,
        account: {
          sid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type
        },
        balance: {
          currency: balance.currency,
          balance: balance.balance
        },
        usage: {
          totalMessages: totalUsage,
          totalCost: Math.round(totalCost * 100) / 100,
          period: 'last_30_days'
        }
      };

    } catch (error) {
      console.error('Failed to get account info:', error);
      throw new Error('Failed to get account information');
    }
  },

  // Handle opt-out keywords
  async processOptOut(phoneNumber: string, message: string) {
    const optOutKeywords = [
      'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT',
      'NDALOJ', 'HIQE', 'STOP', 'CANCEL' // Albanian keywords
    ];

    const normalizedMessage = message.trim().toUpperCase();
    const isOptOut = optOutKeywords.some(keyword =>
      normalizedMessage === keyword || normalizedMessage.includes(keyword)
    );

    if (isOptOut) {
      // Process opt-out in database
      await this.handleOptOut(phoneNumber);

      // Send confirmation message
      const confirmationMessage = 'You have been unsubscribed from AUTO ANI SMS messages. Reply START to resubscribe.';

      try {
        await this.sendSMS({
          to: phoneNumber,
          message: confirmationMessage,
          deliveryReceipts: false
        });
      } catch (error) {
        console.error('Failed to send opt-out confirmation:', error);
      }

      return { optedOut: true, confirmed: true };
    }

    return { optedOut: false };
  },

  // Handle opt-in keywords
  async processOptIn(phoneNumber: string, message: string) {
    const optInKeywords = ['START', 'SUBSCRIBE', 'YES', 'FILLOJ', 'PO']; // Albanian keywords

    const normalizedMessage = message.trim().toUpperCase();
    const isOptIn = optInKeywords.some(keyword =>
      normalizedMessage === keyword || normalizedMessage.includes(keyword)
    );

    if (isOptIn) {
      // Process opt-in in database
      await this.handleOptIn(phoneNumber);

      // Send welcome message
      const welcomeMessage = 'Welcome to AUTO ANI SMS updates! You will receive notifications about new vehicles and special offers. Reply STOP to unsubscribe.';

      try {
        await this.sendSMS({
          to: phoneNumber,
          message: welcomeMessage,
          deliveryReceipts: false
        });
      } catch (error) {
        console.error('Failed to send opt-in welcome:', error);
      }

      return { optedIn: true, welcomed: true };
    }

    return { optedIn: false };
  },

  // Handle database opt-out
  async handleOptOut(phoneNumber: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Find and update customer
      const customer = await prisma.customer.findFirst({
        where: { phone: formattedPhone }
      });

      if (customer) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            smsOptIn: false,
            smsOptOutAt: new Date(),
            smsOptOutMethod: 'keyword'
          }
        });

        console.info(`Customer opted out from SMS: ${formattedPhone}`);
      }

      // Log the opt-out
      await prisma.smsLog.create({
        data: {
          phoneNumber: formattedPhone,
          message: 'OPT_OUT_REQUEST',
          status: 'OPTED_OUT',
          optedOutAt: new Date(),
          sentAt: new Date()
        }
      });

    } catch (error) {
      console.error('Failed to handle SMS opt-out:', error);
    }
  },

  // Handle database opt-in
  async handleOptIn(phoneNumber: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Find and update customer
      const customer = await prisma.customer.findFirst({
        where: { phone: formattedPhone }
      });

      if (customer) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            smsOptIn: true,
            smsOptOutAt: null,
            smsOptOutMethod: null
          }
        });

        console.info(`Customer opted in to SMS: ${formattedPhone}`);
      }

    } catch (error) {
      console.error('Failed to handle SMS opt-in:', error);
    }
  },

  // Validate Twilio configuration
  async validateConfiguration() {
    try {
      if (!env.TWILIO_ACCOUNT_SID) {
        throw new Error('TWILIO_ACCOUNT_SID not configured');
      }

      if (!env.TWILIO_AUTH_TOKEN) {
        throw new Error('TWILIO_AUTH_TOKEN not configured');
      }

      if (!env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER not configured');
      }

      const twilioClient = getTwilioClient();

      // Test the connection
      const account = await twilioClient.api.accounts(env.TWILIO_ACCOUNT_SID!).fetch();

      return {
        success: true,
        configuration: {
          accountSid: env.TWILIO_ACCOUNT_SID,
          phoneNumber: env.TWILIO_PHONE_NUMBER,
          accountStatus: account.status,
          accountType: account.type
        }
      };

    } catch (error) {
      console.error('Twilio configuration validation failed:', error);
      throw error;
    }
  },

  // Get human-readable error messages for Twilio error codes
  getTwilioErrorMessage(errorCode: number): string {
    const errorMessages: Record<number, string> = {
      21211: 'Invalid phone number format',
      21214: 'Invalid phone number',
      21408: 'Permission to send to this number denied',
      21610: 'Message blocked by carrier',
      21614: 'Invalid number - unable to reach this phone number',
      30001: 'Queue overflow - message queue full',
      30002: 'Account suspended',
      30003: 'Unreachable destination handset',
      30004: 'Message blocked by carrier',
      30005: 'Unknown destination handset',
      30006: 'Landline or unreachable carrier',
      30007: 'Carrier violation - message filtered',
      30008: 'Unknown error',
      30009: 'Missing segment',
      30010: 'Message price exceeded max price'
    };

    return errorMessages[errorCode] || 'Unknown error occurred';
  },

  // Test SMS configuration
  async testSMSConfiguration(testPhoneNumber?: string) {
    try {
      const testNumber = testPhoneNumber || process.env.TEST_PHONE_NUMBER;

      if (!testNumber) {
        throw new Error('No test phone number provided');
      }

      const response = await this.sendSMS({
        to: testNumber,
        message: `AUTO ANI SMS Test - ${new Date().toISOString()}`,
        deliveryReceipts: true
      });

      return {
        success: true,
        messageId: response.messageId,
        testNumber: this.formatPhoneNumber(testNumber)
      };

    } catch (error) {
      console.error('SMS configuration test failed:', error);
      throw new Error('SMS configuration test failed');
    }
  }
};

// Import prisma for database operations
import { prisma } from '@/lib/database';

// Default export
export default SMSService;