// Trigger Manager for Marketing Automation Workflows
// Handles different types of triggers and their registration

import { EventEmitter } from 'events';
import { addMarketingJob, JOB_TYPES, JOB_PRIORITY } from '@/lib/queues/marketingQueue';

export interface TriggerEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
  customerId?: string;
  vehicleId?: string;
  sessionId?: string;
}

export class TriggerManager extends EventEmitter {
  private registeredTriggers: Set<string> = new Set();

  constructor() {
    super();
    this.setupDefaultTriggers();
  }

  /**
   * Register a trigger type
   */
  registerTrigger(triggerType: string): void {
    this.registeredTriggers.add(triggerType);
    console.log(`Registered trigger: ${triggerType}`);
  }

  /**
   * Fire a trigger event
   */
  async fireTrigger(triggerEvent: TriggerEvent): Promise<void> {
    try {
      console.log(`Firing trigger: ${triggerEvent.type}`, {
        data: triggerEvent.data,
        source: triggerEvent.source
      });

      // Emit the event for immediate processing
      this.emit('trigger', triggerEvent);

      // Also queue for asynchronous processing to ensure reliability
      await addMarketingJob(
        'PROCESS_TRIGGER',
        {
          triggerType: triggerEvent.type,
          triggerData: triggerEvent.data,
          context: {
            customerId: triggerEvent.customerId,
            vehicleId: triggerEvent.vehicleId,
            sessionId: triggerEvent.sessionId,
            source: triggerEvent.source,
            timestamp: triggerEvent.timestamp.toISOString()
          }
        },
        {
          priority: this.getTriggerPriority(triggerEvent.type),
          attempts: 3
        }
      );

    } catch (error) {
      console.error('Error firing trigger:', error);
      throw error;
    }
  }

  /**
   * Get priority for different trigger types
   */
  private getTriggerPriority(triggerType: string): number {
    switch (triggerType) {
      case 'VEHICLE_INQUIRY':
      case 'TEST_DRIVE_REQUEST':
      case 'PHONE_CALL':
        return JOB_PRIORITY.CRITICAL;

      case 'FORM_SUBMIT':
      case 'VEHICLE_VIEWED':
      case 'EMAIL_OPENED':
        return JOB_PRIORITY.HIGH;

      case 'ABANDONED_SEARCH':
      case 'EMAIL_CLICKED':
      case 'SMS_RECEIVED':
        return JOB_PRIORITY.NORMAL;

      case 'BIRTHDAY':
      case 'ANNIVERSARY':
      case 'SERVICE_DUE':
        return JOB_PRIORITY.LOW;

      default:
        return JOB_PRIORITY.NORMAL;
    }
  }

  /**
   * Setup default trigger types
   */
  private setupDefaultTriggers(): void {
    const defaultTriggers = [
      'FORM_SUBMIT',
      'VEHICLE_INQUIRY',
      'TEST_DRIVE_REQUEST',
      'ABANDONED_SEARCH',
      'BIRTHDAY',
      'ANNIVERSARY',
      'SERVICE_DUE',
      'VEHICLE_VIEWED',
      'EMAIL_OPENED',
      'EMAIL_CLICKED',
      'SMS_RECEIVED',
      'PHONE_CALL',
      'APPOINTMENT_SCHEDULED',
      'PURCHASE_COMPLETED'
    ];

    defaultTriggers.forEach(trigger => this.registerTrigger(trigger));
  }

  /**
   * Create trigger for vehicle inquiry
   */
  async fireVehicleInquiry(data: {
    vehicleId: string;
    customerId?: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    inquiryType: string;
    message?: string;
    sessionId?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'VEHICLE_INQUIRY',
      data,
      timestamp: new Date(),
      source: 'vehicle_inquiry_form',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      sessionId: data.sessionId
    });
  }

  /**
   * Create trigger for test drive request
   */
  async fireTestDriveRequest(data: {
    vehicleId: string;
    customerId?: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    preferredDate?: string;
    preferredTime?: string;
    sessionId?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'TEST_DRIVE_REQUEST',
      data,
      timestamp: new Date(),
      source: 'test_drive_form',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      sessionId: data.sessionId
    });
  }

  /**
   * Create trigger for form submission
   */
  async fireFormSubmit(data: {
    formType: string;
    formData: any;
    customerId?: string;
    sessionId?: string;
    source: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'FORM_SUBMIT',
      data,
      timestamp: new Date(),
      source: data.source,
      customerId: data.customerId,
      sessionId: data.sessionId
    });
  }

  /**
   * Create trigger for vehicle view
   */
  async fireVehicleViewed(data: {
    vehicleId: string;
    customerId?: string;
    sessionId: string;
    timeSpent: number;
    source: string;
    referrer?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'VEHICLE_VIEWED',
      data,
      timestamp: new Date(),
      source: data.source,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      sessionId: data.sessionId
    });
  }

  /**
   * Create trigger for abandoned search
   */
  async fireAbandonedSearch(data: {
    searchQuery: string;
    filters: any;
    resultsCount: number;
    timeSpent: number;
    customerId?: string;
    sessionId: string;
    lastActivity: Date;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'ABANDONED_SEARCH',
      data,
      timestamp: new Date(),
      source: 'search_abandonment_detector',
      customerId: data.customerId,
      sessionId: data.sessionId
    });
  }

  /**
   * Create trigger for email engagement
   */
  async fireEmailEngagement(data: {
    action: 'opened' | 'clicked' | 'bounced' | 'complained';
    emailCampaignId: string;
    messageId: string;
    customerId?: string;
    email: string;
    linkUrl?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    const triggerType = data.action === 'opened' ? 'EMAIL_OPENED' : 'EMAIL_CLICKED';

    await this.fireTrigger({
      type: triggerType,
      data,
      timestamp: new Date(),
      source: 'email_tracking',
      customerId: data.customerId
    });
  }

  /**
   * Create trigger for SMS response
   */
  async fireSMSReceived(data: {
    phoneNumber: string;
    message: string;
    smsCampaignId?: string;
    customerId?: string;
    inReplyTo?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'SMS_RECEIVED',
      data,
      timestamp: new Date(),
      source: 'sms_webhook',
      customerId: data.customerId
    });
  }

  /**
   * Create trigger for phone call
   */
  async firePhoneCall(data: {
    phoneNumber: string;
    duration: number;
    callType: 'inbound' | 'outbound';
    customerId?: string;
    salesPersonId?: string;
    outcome?: string;
    notes?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'PHONE_CALL',
      data,
      timestamp: new Date(),
      source: 'call_tracking',
      customerId: data.customerId
    });
  }

  /**
   * Create trigger for appointment scheduling
   */
  async fireAppointmentScheduled(data: {
    appointmentId: string;
    vehicleId?: string;
    customerId?: string;
    appointmentType: string;
    scheduledDate: Date;
    salesPersonId?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'APPOINTMENT_SCHEDULED',
      data,
      timestamp: new Date(),
      source: 'appointment_system',
      customerId: data.customerId,
      vehicleId: data.vehicleId
    });
  }

  /**
   * Create trigger for purchase completion
   */
  async firePurchaseCompleted(data: {
    transactionId: string;
    vehicleId: string;
    customerId: string;
    salePrice: number;
    salesPersonId?: string;
    financingType?: string;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'PURCHASE_COMPLETED',
      data,
      timestamp: new Date(),
      source: 'sales_system',
      customerId: data.customerId,
      vehicleId: data.vehicleId
    });
  }

  /**
   * Create trigger for birthday/anniversary
   */
  async fireDateBasedTrigger(data: {
    triggerType: 'BIRTHDAY' | 'ANNIVERSARY';
    customerId: string;
    date: Date;
    customerData: any;
  }): Promise<void> {
    await this.fireTrigger({
      type: data.triggerType,
      data,
      timestamp: new Date(),
      source: 'date_based_scheduler',
      customerId: data.customerId
    });
  }

  /**
   * Create trigger for service due reminder
   */
  async fireServiceDue(data: {
    customerId: string;
    vehicleId: string;
    serviceType: string;
    dueDate: Date;
    mileage?: number;
    lastServiceDate?: Date;
  }): Promise<void> {
    await this.fireTrigger({
      type: 'SERVICE_DUE',
      data,
      timestamp: new Date(),
      source: 'service_scheduler',
      customerId: data.customerId,
      vehicleId: data.vehicleId
    });
  }

  /**
   * Batch fire multiple triggers (useful for data migration or bulk operations)
   */
  async fireBatchTriggers(triggers: TriggerEvent[]): Promise<void> {
    console.log(`Firing batch of ${triggers.length} triggers`);

    const batchPromises = triggers.map(trigger => this.fireTrigger(trigger));

    try {
      await Promise.all(batchPromises);
      console.log(`Successfully fired ${triggers.length} triggers`);
    } catch (error) {
      console.error('Error firing batch triggers:', error);
      throw error;
    }
  }

  /**
   * Get trigger statistics
   */
  async getTriggerStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    // This would typically query a metrics database
    // For now, return placeholder data
    return {
      timeframe,
      totalTriggers: 0,
      triggersByType: {},
      avgProcessingTime: 0,
      failureRate: 0
    };
  }

  /**
   * Test trigger firing
   */
  async testTrigger(triggerType: string, testData: any): Promise<boolean> {
    try {
      console.log(`Testing trigger: ${triggerType}`, testData);

      await this.fireTrigger({
        type: triggerType,
        data: { ...testData, isTest: true },
        timestamp: new Date(),
        source: 'test_trigger'
      });

      return true;
    } catch (error) {
      console.error(`Test trigger failed: ${triggerType}`, error);
      return false;
    }
  }
}

export default TriggerManager;