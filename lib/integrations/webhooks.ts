// Webhook System for AUTO ANI
// Handles outgoing webhooks for real-time data synchronization with external systems

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { retryWithBackoff } from '@/lib/api-utils';

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: any;
}

export interface RegisterWebhookParams {
  url: string;
  events: string[];
  secret?: string;
  description?: string;
}

// Webhook Service Class
export class WebhookService {
  /**
   * Register a new webhook
   */
  static async registerWebhook(
    params: RegisterWebhookParams
  ): Promise<string> {
    const { url, events, secret, description } = params;

    // Generate secret if not provided
    const webhookSecret =
      secret || crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        url,
        events: JSON.stringify(events),
        secret: webhookSecret,
        description,
        isActive: true,
      },
    });

    return webhook.id;
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhook(
    webhookId: string,
    params: Partial<RegisterWebhookParams> & { isActive?: boolean }
  ): Promise<void> {
    const updateData: any = {};

    if (params.url) updateData.url = params.url;
    if (params.events) updateData.events = JSON.stringify(params.events);
    if (params.secret) updateData.secret = params.secret;
    if (params.description) updateData.description = params.description;
    if (params.isActive !== undefined) updateData.isActive = params.isActive;

    await prisma.webhook.update({
      where: { id: webhookId },
      data: updateData,
    });
  }

  /**
   * Delete a webhook
   */
  static async deleteWebhook(webhookId: string): Promise<void> {
    await prisma.webhook.delete({
      where: { id: webhookId },
    });
  }

  /**
   * Trigger webhook for an event
   */
  static async triggerEvent(
    eventName: string,
    eventData: any
  ): Promise<void> {
    // Find all webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
      },
    });

    const relevantWebhooks = webhooks.filter((webhook: any) => {
      const events = JSON.parse(webhook.events);
      return events.includes(eventName) || events.includes('*');
    });

    if (relevantWebhooks.length === 0) {
      console.log(`No webhooks registered for event: ${eventName}`);
      return;
    }

    // Create webhook payload
    const payload: WebhookEvent = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    // Trigger all relevant webhooks
    await Promise.allSettled(
      relevantWebhooks.map((webhook: any) =>
        this.deliverWebhook(webhook.id, webhook.url, webhook.secret, payload)
      )
    );
  }

  /**
   * Deliver webhook to endpoint
   */
  private static async deliverWebhook(
    webhookId: string,
    url: string,
    secret: string,
    payload: WebhookEvent
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);

    // Generate signature
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Create delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event: payload.event,
        payload: payloadString,
        status: 'PENDING',
      },
    });

    try {
      // Attempt delivery with retry logic
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': payload.event,
              'X-Webhook-Timestamp': payload.timestamp,
              'User-Agent': 'AUTO-ANI-Webhook/1.0',
            },
            body: payloadString,
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          return res;
        },
        {
          maxRetries: 3,
          shouldRetry: (error: any) => {
            // Retry on network errors or 5xx errors
            return (
              error.code === 'ECONNRESET' ||
              error.message.includes('5')
            );
          },
        }
      );

      const responseBody = await response.text();

      // Update delivery record
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SUCCESS',
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000), // Limit stored response
          deliveredAt: new Date(),
        },
      });

      // Update webhook last triggered
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });

      console.log(`Webhook delivered: ${webhookId} -> ${payload.event}`);
    } catch (error: any) {
      console.error(`Webhook delivery failed: ${webhookId}`, error);

      // Update delivery record
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: delivery.retryCount + 1,
        },
      });

      // Update webhook failure count
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (webhook) {
        const newFailureCount = webhook.failureCount + 1;

        // Disable webhook after 10 consecutive failures
        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            failureCount: newFailureCount,
            lastError: error.message,
            ...(newFailureCount >= 10 && { isActive: false }),
          },
        });
      }
    }
  }

  /**
   * Retry failed webhook delivery
   */
  static async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery || !delivery.webhook) {
      throw new Error('Delivery not found');
    }

    if (delivery.status === 'SUCCESS') {
      throw new Error('Delivery already successful');
    }

    if (delivery.retryCount >= 5) {
      throw new Error('Maximum retry attempts reached');
    }

    const payload = JSON.parse(delivery.payload);

    await this.deliverWebhook(
      delivery.webhookId,
      delivery.webhook.url,
      delivery.webhook.secret,
      payload
    );
  }

  /**
   * Get webhook delivery history
   */
  static async getDeliveryHistory(
    webhookId: string,
    limit = 50
  ): Promise<any[]> {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(
    webhookId: string
  ): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    lastDelivery?: Date;
  }> {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
    });

    const total = deliveries.length;
    const successful = deliveries.filter(
      (d: any) => d.status === 'SUCCESS'
    ).length;
    const failed = deliveries.filter((d: any) => d.status === 'FAILED').length;

    const lastDelivery = deliveries.length > 0
      ? deliveries[0].createdAt
      : undefined;

    return {
      totalDeliveries: total,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      lastDelivery,
    };
  }

  /**
   * List all webhooks
   */
  static async listWebhooks(): Promise<any[]> {
    return prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Test webhook delivery
   */
  static async testWebhook(webhookId: string): Promise<void> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    await this.deliverWebhook(
      webhook.id,
      webhook.url,
      webhook.secret,
      {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook',
          webhookId: webhook.id,
        },
      }
    );
  }

  /**
   * Verify webhook signature with constant-time comparison
   * Prevents timing attacks on webhook signature validation
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    try {
      // crypto.timingSafeEqual requires equal-length buffers
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      // If buffers have different lengths, signature is invalid
      return false;
    }
  }
}

// Webhook event types
export const WebhookEvents = {
  // Vehicle events
  VEHICLE_CREATED: 'vehicle.created',
  VEHICLE_UPDATED: 'vehicle.updated',
  VEHICLE_DELETED: 'vehicle.deleted',
  VEHICLE_SOLD: 'vehicle.sold',

  // Inquiry events
  INQUIRY_RECEIVED: 'inquiry.received',
  INQUIRY_UPDATED: 'inquiry.updated',

  // Contact events
  CONTACT_RECEIVED: 'contact.received',

  // Appointment events
  APPOINTMENT_SCHEDULED: 'appointment.scheduled',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_COMPLETED: 'appointment.completed',

  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Delivery events
  DELIVERY_SCHEDULED: 'delivery.scheduled',
  DELIVERY_IN_TRANSIT: 'delivery.in_transit',
  DELIVERY_COMPLETED: 'delivery.completed',

  // Newsletter events
  NEWSLETTER_SUBSCRIBED: 'newsletter.subscribed',
  NEWSLETTER_UNSUBSCRIBED: 'newsletter.unsubscribed',

  // All events
  ALL: '*',
};

export default WebhookService;