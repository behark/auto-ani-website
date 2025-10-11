// Stripe Payment Processing Integration for AUTO ANI
// Handles vehicle deposits, full payments, and refunds

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  ExternalAPIError,
  retryWithBackoff,
  Cache,
  getEnvVar,
} from '@/lib/api-utils';

// Initialize Stripe client
const stripe = new Stripe(getEnvVar('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-08-27.basil' as any,
  typescript: true,
});

// Cache for customer data
const customerCache = new Cache<Stripe.Customer>();

export interface CreatePaymentIntentParams {
  vehicleId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'PARTIAL_PAYMENT';
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  vehicleId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'PARTIAL_PAYMENT';
  description?: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number; // Amount in cents, if partial refund
  reason?: string;
}

// Stripe Service Class
export class StripeService {
  /**
   * Create or retrieve a Stripe customer
   */
  static async getOrCreateCustomer(
    email: string,
    name?: string,
    phone?: string
  ): Promise<Stripe.Customer> {
    // Check cache first
    const cacheKey = `customer:${email}`;
    const cached = customerCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return retryWithBackoff(
      async () => {
        // Search for existing customer
        const existingCustomers = await stripe.customers.list({
          email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          const customer = existingCustomers.data[0];
          customerCache.set(cacheKey, customer, 3600); // Cache for 1 hour
          return customer;
        }

        // Create new customer
        const customer = await stripe.customers.create({
          email,
          name,
          phone,
          metadata: {
            source: 'auto-ani-website',
          },
        });

        customerCache.set(cacheKey, customer, 3600);
        return customer;
      },
      {
        maxRetries: 3,
        shouldRetry: (error: any) => error.type === 'StripeConnectionError',
      }
    );
  }

  /**
   * Create a payment intent for direct card payments
   */
  static async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<{ paymentIntent: Stripe.PaymentIntent; clientSecret: string }> {
    const {
      vehicleId,
      amount,
      currency = 'eur',
      customerEmail,
      customerName,
      customerPhone,
      paymentType,
      description,
      metadata = {},
    } = params;

    try {
      // Get or create customer
      const customer = await this.getOrCreateCustomer(
        customerEmail,
        customerName,
        customerPhone
      );

      // Create payment intent
      const paymentIntent = await retryWithBackoff(
        () =>
          stripe.paymentIntents.create({
            amount,
            currency,
            customer: customer.id,
            description:
              description || `${paymentType} for Vehicle ${vehicleId}`,
            metadata: {
              vehicleId,
              paymentType,
              customerEmail,
              ...metadata,
            },
            automatic_payment_methods: {
              enabled: true,
            },
            receipt_email: customerEmail,
          }),
        {
          shouldRetry: (error: any) => error.type === 'StripeConnectionError',
        }
      );

      // Store in database
      await prisma.payment.create({
        data: {
          vehicleId,
          customerId: customer.id,
          customerEmail,
          customerName,
          customerPhone,
          amount,
          currency,
          paymentMethod: 'STRIPE',
          paymentType,
          status: 'PENDING',
          stripePaymentId: paymentIntent.id,
          description,
          metadata: JSON.stringify(metadata),
        },
      });

      // Store payment intent
      await prisma.paymentIntent.create({
        data: {
          vehicleId,
          amount,
          currency,
          status: 'PENDING',
          provider: 'STRIPE',
          providerId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret || undefined,
          metadata: JSON.stringify({ customerEmail, paymentType }),
        },
      });

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: any) {
      console.error('Stripe Payment Intent Error:', error);
      throw new ExternalAPIError('Stripe', error.message, {
        code: error.code,
        type: error.type,
      });
    }
  }

  /**
   * Create a checkout session for hosted payment page
   */
  static async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<{ session: Stripe.Checkout.Session; url: string }> {
    const {
      vehicleId,
      amount,
      currency = 'eur',
      customerEmail,
      customerName,
      successUrl,
      cancelUrl,
      paymentType,
      description,
    } = params;

    try {
      // Get or create customer
      const customer = await this.getOrCreateCustomer(
        customerEmail,
        customerName
      );

      // Create checkout session
      const session = await retryWithBackoff(
        () =>
          stripe.checkout.sessions.create({
            customer: customer.id,
            mode: 'payment',
            payment_method_types: ['card', 'sepa_debit', 'bancontact'],
            line_items: [
              {
                price_data: {
                  currency,
                  product_data: {
                    name:
                      description ||
                      `Vehicle ${paymentType.replace('_', ' ')}`,
                    description: `Payment for vehicle ID: ${vehicleId}`,
                  },
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail,
            metadata: {
              vehicleId,
              paymentType,
              customerEmail,
            },
          }),
        {
          shouldRetry: (error: any) => error.type === 'StripeConnectionError',
        }
      );

      // Store in database
      await prisma.payment.create({
        data: {
          vehicleId,
          customerId: customer.id,
          customerEmail,
          customerName,
          amount,
          currency,
          paymentMethod: 'STRIPE',
          paymentType,
          status: 'PENDING',
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          description,
        },
      });

      return {
        session,
        url: session.url!,
      };
    } catch (error: any) {
      console.error('Stripe Checkout Session Error:', error);
      throw new ExternalAPIError('Stripe', error.message, {
        code: error.code,
        type: error.type,
      });
    }
  }

  /**
   * Retrieve payment intent status
   */
  static async getPaymentIntentStatus(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await retryWithBackoff(
        () => stripe.paymentIntents.retrieve(paymentIntentId),
        {
          shouldRetry: (error: any) => error.type === 'StripeConnectionError',
        }
      );
    } catch (error: any) {
      console.error('Stripe Retrieve Payment Intent Error:', error);
      throw new ExternalAPIError('Stripe', error.message);
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    params: RefundPaymentParams
  ): Promise<Stripe.Refund> {
    const { paymentId, amount, reason } = params;

    try {
      // Get payment from database
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || !payment.stripePaymentId) {
        throw new Error('Payment not found or not a Stripe payment');
      }

      // Create refund
      const refund = await retryWithBackoff(
        () =>
          stripe.refunds.create({
            payment_intent: payment.stripePaymentId!,
            amount,
            reason: reason as Stripe.RefundCreateParams.Reason,
          }),
        {
          shouldRetry: (error: any) => error.type === 'StripeConnectionError',
        }
      );

      // Update payment in database
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount === payment.amount ? 'REFUNDED' : 'COMPLETED',
          refundAmount: (payment.refundAmount || 0) + (amount || payment.amount),
          refundReason: reason,
          refundedAt: new Date(),
        },
      });

      return refund;
    } catch (error: any) {
      console.error('Stripe Refund Error:', error);
      throw new ExternalAPIError('Stripe', error.message, {
        code: error.code,
        type: error.type,
      });
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    const webhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET');

    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      console.log(`Stripe webhook received: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return event;
    } catch (error: any) {
      console.error('Stripe Webhook Error:', error);
      throw new ExternalAPIError('Stripe', error.message);
    }
  }

  /**
   * Handle successful payment intent
   */
  private static async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.paymentIntent.updateMany({
      where: { providerId: paymentIntent.id },
      data: {
        status: 'SUCCEEDED',
      },
    });

    console.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  /**
   * Handle failed payment intent
   */
  private static async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message,
      },
    });

    await prisma.paymentIntent.updateMany({
      where: { providerId: paymentIntent.id },
      data: {
        status: 'FAILED',
      },
    });

    console.log(`Payment failed: ${paymentIntent.id}`);
  }

  /**
   * Handle completed checkout session
   */
  private static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log(`Checkout session completed: ${session.id}`);
  }

  /**
   * Handle charge refunded
   */
  private static async handleChargeRefunded(
    charge: Stripe.Charge
  ): Promise<void> {
    if (!charge.payment_intent) return;

    await prisma.payment.updateMany({
      where: { stripePaymentId: charge.payment_intent as string },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    console.log(`Charge refunded: ${charge.id}`);
  }

  /**
   * List customer payments
   */
  static async listCustomerPayments(
    customerEmail: string
  ): Promise<any[]> {
    return prisma.payment.findMany({
      where: { customerEmail },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(vehicleId?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalAmount: number;
  }> {
    const where = vehicleId ? { vehicleId } : {};

    const payments = await prisma.payment.findMany({ where });

    return {
      total: payments.length,
      completed: payments.filter((p: any) => p.status === 'COMPLETED').length,
      pending: payments.filter((p: any) => p.status === 'PENDING').length,
      failed: payments.filter((p: any) => p.status === 'FAILED').length,
      totalAmount: payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: any, p: any) => sum + p.amount, 0),
    };
  }
}

export default StripeService;