import Stripe from 'stripe';
import { env, hasStripe } from './env';

// Initialize Stripe with secret key (only in runtime)
export const stripe = hasStripe
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  : null;

// Payment processing utilities
export class PaymentProcessor {
  /**
   * Create a payment intent for vehicle reservation
   */
  static async createReservationPayment(
    vehicleId: string,
    amount: number,
    currency: string = 'EUR',
    customerEmail: string,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          vehicleId,
          type: 'vehicle_reservation',
          customerEmail,
          ...metadata,
        },
        receipt_email: customerEmail,
        description: `Vehicle reservation deposit - ${vehicleId}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a payment intent for parts/accessories purchase
   */
  static async createPartsPayment(
    orderId: string,
    amount: number,
    currency: string = 'EUR',
    customerEmail: string,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          type: 'parts_order',
          customerEmail,
          ...metadata,
        },
        receipt_email: customerEmail,
        description: `Parts order - ${orderId}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment intent
   */
  static async confirmPayment(paymentIntentId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntent,
        };
      }

      return {
        success: false,
        status: paymentIntent.status,
        paymentIntent,
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Process refund
   */
  static async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? amount * 100 : undefined, // Convert to cents if amount provided
        reason: reason || 'requested_by_customer',
      });

      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Refund failed:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      return customer;
    } catch (error) {
      console.error('Customer creation failed:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create subscription for premium services
   */
  static async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata,
      });

      return subscription;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Create checkout session for full vehicle purchase
   */
  static async createCheckoutSession(
    vehicleId: string,
    amount: number,
    currency: string = 'EUR',
    customerEmail: string,
    successUrl: string,
    cancelUrl: string
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'sepa_debit', 'ideal'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Vehicle Purchase - ${vehicleId}`,
                description: 'Full vehicle payment',
              },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
          vehicleId,
          type: 'vehicle_purchase',
        },
        payment_intent_data: {
          metadata: {
            vehicleId,
            type: 'vehicle_purchase',
          },
        },
        invoice_creation: {
          enabled: true,
        },
      });

      return session;
    } catch (error) {
      console.error('Checkout session creation failed:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Validate webhook signature
   */
  static validateWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        secret
      );
      return event;
    } catch (error) {
      console.error('Webhook validation failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get payment method details
   */
  static async getPaymentMethod(paymentMethodId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error('Failed to retrieve payment method:', error);
      throw new Error('Failed to retrieve payment method');
    }
  }

  /**
   * Create invoice for completed transaction
   */
  static async createInvoice(
    customerId: string,
    items: Array<{ amount: number; description: string }>,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: true,
        metadata,
      });

      // Add line items
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: item.amount * 100, // Convert to cents
          description: item.description,
          invoice: invoice.id,
        });
      }

      // Finalize invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id!);

      return finalizedInvoice;
    } catch (error) {
      console.error('Invoice creation failed:', error);
      throw new Error('Failed to create invoice');
    }
  }
}

// Currency conversion utilities
export class CurrencyConverter {
  private static rates: Record<string, number> = {};
  private static lastUpdate: Date | null = null;
  private static readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Get exchange rates from ECB or fallback service
   */
  static async getExchangeRates(): Promise<Record<string, number>> {
    // Check if we have cached rates that are still fresh
    if (
      this.lastUpdate &&
      Date.now() - this.lastUpdate.getTime() < this.CACHE_DURATION
    ) {
      return this.rates;
    }

    try {
      // In production, you would fetch from ECB API or similar
      // For now, using static rates as example
      this.rates = {
        EUR: 1,
        USD: 1.08,
        GBP: 0.86,
        ALL: 108.50, // Albanian Lek
        RSD: 117.20, // Serbian Dinar
        CHF: 0.94,
        AED: 3.97, // UAE Dirham for expats
      };

      this.lastUpdate = new Date();
      return this.rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return cached rates if available, or default rates
      return this.rates || { EUR: 1, USD: 1.08, GBP: 0.86 };
    }
  }

  /**
   * Convert amount between currencies
   */
  static async convert(
    amount: number,
    from: string,
    to: string
  ): Promise<number> {
    if (from === to) return amount;

    const rates = await this.getExchangeRates();

    // Convert to EUR first (base currency)
    const eurAmount = amount / (rates[from] || 1);

    // Then convert to target currency
    const targetAmount = eurAmount * (rates[to] || 1);

    return Math.round(targetAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format amount with currency symbol
   */
  static formatCurrency(
    amount: number,
    currency: string,
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

// Webhook event handlers
export const WebhookHandlers = {
  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Update database with payment status
    // This would typically update your reservation or order
    console.info('Payment succeeded:', paymentIntent.id);

    // Send confirmation email
    // Trigger inventory update
    // Create invoice

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
    };
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Log the failure
    console.error('Payment failed:', paymentIntent.id);

    // Update database
    // Send failure notification

    return {
      success: false,
      paymentIntentId: paymentIntent.id,
    };
  },

  /**
   * Handle refund
   */
  async handleRefund(event: Stripe.Event) {
    const refund = event.data.object as Stripe.Refund;

    // Update database with refund status
    console.info('Refund processed:', refund.id);

    // Update inventory if needed
    // Send refund confirmation

    return {
      success: true,
      refundId: refund.id,
    };
  },
};