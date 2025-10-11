// Test script for email service configuration
// Usage: npx ts-node scripts/test-email.ts

import { ResendEmailService } from '../lib/integrations/resend';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testEmailService() {
  console.log('🔧 Testing Email Service Configuration...\n');

  // Check environment variables
  const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'ADMIN_EMAIL'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\nPlease set these variables in your .env.local file');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');
  console.log('   FROM_EMAIL:', process.env.FROM_EMAIL);
  console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

  // Test email sending
  try {
    console.log('\n📧 Sending test email...');

    const result = await ResendEmailService.sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: 'AUTO ANI - Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            Email Service Test Successful! 🎉
          </h1>

          <p style="color: #374151; line-height: 1.6;">
            This is a test email from your AUTO ANI website to verify that the email service is properly configured.
          </p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Configuration Details:</h3>
            <ul style="color: #6b7280;">
              <li><strong>Service:</strong> Resend</li>
              <li><strong>From:</strong> ${process.env.FROM_EMAIL}</li>
              <li><strong>Admin Email:</strong> ${process.env.ADMIN_EMAIL}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>

          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #166534; margin: 0;">
              ✅ <strong>Your email service is working correctly!</strong>
            </p>
          </div>
        </div>
      `,
      tags: [
        { name: 'type', value: 'test' },
        { name: 'source', value: 'test-script' }
      ]
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Email ID:', result.id);
    console.log('   Sent to:', result.to);
    console.log('   Created at:', result.created_at);

    // Test contact form notification
    console.log('\n📧 Testing contact form notification...');

    await ResendEmailService.sendContactFormNotification({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+383 49 123 456',
      subject: 'Test Inquiry',
      message: 'This is a test message from the email configuration script.\nIt includes multiple lines to test formatting.'
    });

    console.log('✅ Contact form notification sent successfully!');

    // Test vehicle inquiry notification
    console.log('\n📧 Testing vehicle inquiry notification...');

    await ResendEmailService.sendVehicleInquiryNotification({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+383 49 123 456',
      message: 'I am interested in this vehicle. Please contact me.',
      inquiryType: 'Test Drive Request',
      vehicle: {
        make: 'Volkswagen',
        model: 'Golf 7 GTD',
        year: 2017,
        price: 18500,
        id: 'test-vehicle-123'
      }
    });

    console.log('✅ Vehicle inquiry notification sent successfully!');

    console.log('\n🎉 All email tests passed successfully!');
    console.log('\nCheck your inbox at:', process.env.ADMIN_EMAIL);

  } catch (error: any) {
    console.error('\n❌ Email test failed:', error.message);

    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Make sure your RESEND_API_KEY is valid');
      console.log('   Get your API key from: https://resend.com/api-keys');
    }

    if (error.message.includes('domain')) {
      console.log('\n💡 Tip: Verify your domain in Resend dashboard');
      console.log('   Or use an email from a verified domain');
    }

    process.exit(1);
  }
}

// Run the test
testEmailService().catch(console.error);