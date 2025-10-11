// Action Executor for Marketing Automation Workflows
// Executes various types of actions in workflows

import { prisma } from '@/lib/database';
import { WorkflowContext, WorkflowAction } from './WorkflowEngine';
import { EmailService } from '@/lib/email';
import { addMarketingJob, JOB_TYPES, JOB_PRIORITY } from '@/lib/queues/marketingQueue';

export class ActionExecutor {
  /**
   * Execute a workflow action
   */
  async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    console.log(`Executing action: ${action.type}`, action.config);

    try {
      switch (action.type) {
        case 'send_email':
          await this.executeSendEmail(action, context);
          break;

        case 'send_sms':
          await this.executeSendSMS(action, context);
          break;

        case 'add_to_segment':
          await this.executeAddToSegment(action, context);
          break;

        case 'score_lead':
          await this.executeScoreLead(action, context);
          break;

        case 'create_task':
          await this.executeCreateTask(action, context);
          break;

        case 'wait':
          await this.executeWait(action, context);
          break;

        case 'webhook':
          await this.executeWebhook(action, context);
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      console.log(`Successfully executed action: ${action.type}`);

    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      throw error;
    }
  }

  /**
   * Send email action
   */
  private async executeSendEmail(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    // Get recipient email
    let recipientEmail = config.email;
    let recipientName = config.name || 'Customer';

    if (!recipientEmail && context.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: context.customerId }
      });
      if (customer) {
        recipientEmail = customer.email;
        recipientName = `${customer.firstName} ${customer.lastName}`;
      }
    }

    if (!recipientEmail && context.contactId) {
      const contact = await prisma.vehicleInquiry.findUnique({
        where: { id: context.contactId }
      });
      if (contact) {
        recipientEmail = contact.email;
        recipientName = contact.name;
      }
    }

    if (!recipientEmail && context.triggerData?.email) {
      recipientEmail = context.triggerData.email;
      recipientName = context.triggerData.name || 'Customer';
    }

    if (!recipientEmail) {
      throw new Error('No recipient email found for send_email action');
    }

    // Process email template with personalization
    const personalizedSubject = this.personalizeContent(config.subject, context, {
      customerName: recipientName,
      customerEmail: recipientEmail
    });

    const personalizedContent = this.personalizeContent(config.content, context, {
      customerName: recipientName,
      customerEmail: recipientEmail
    });

    // Queue email for sending
    await addMarketingJob(
      'SEND_SINGLE_EMAIL',
      {
        to: recipientEmail,
        subject: personalizedSubject,
        content: personalizedContent,
        customerId: context.customerId,
        workflowContext: context,
        priority: config.priority || 'normal'
      },
      {
        priority: config.priority === 'high' ? JOB_PRIORITY.HIGH : JOB_PRIORITY.NORMAL
      }
    );
  }

  /**
   * Send SMS action
   */
  private async executeSendSMS(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    // Get recipient phone number
    let phoneNumber = config.phoneNumber;

    if (!phoneNumber && context.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: context.customerId }
      });
      phoneNumber = customer?.phone;
    }

    if (!phoneNumber && context.contactId) {
      const contact = await prisma.vehicleInquiry.findUnique({
        where: { id: context.contactId }
      });
      phoneNumber = contact?.phone;
    }

    if (!phoneNumber && context.triggerData?.phone) {
      phoneNumber = context.triggerData.phone;
    }

    if (!phoneNumber) {
      throw new Error('No recipient phone number found for send_sms action');
    }

    // Personalize SMS content
    const personalizedMessage = this.personalizeContent(config.message, context);

    // Queue SMS for sending
    await addMarketingJob(
      'SEND_SINGLE_SMS',
      {
        to: phoneNumber,
        message: personalizedMessage,
        customerId: context.customerId,
        workflowContext: context
      },
      {
        priority: JOB_PRIORITY.NORMAL
      }
    );
  }

  /**
   * Add to segment action
   */
  private async executeAddToSegment(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    if (!context.customerId) {
      throw new Error('Customer ID required for add_to_segment action');
    }

    // Check if segment exists
    const segment = await prisma.customerSegment.findUnique({
      where: { id: config.segmentId }
    });

    if (!segment) {
      throw new Error(`Segment ${config.segmentId} not found`);
    }

    // Add customer to segment (if not already in it)
    await prisma.segmentMembership.upsert({
      where: {
        segmentId_customerId: {
          segmentId: config.segmentId,
          customerId: context.customerId
        }
      },
      update: {
        isActive: true,
        leftAt: null
      },
      create: {
        segmentId: config.segmentId,
        customerId: context.customerId,
        isActive: true
      }
    });

    // Update segment member count
    await prisma.customerSegment.update({
      where: { id: config.segmentId },
      data: {
        customerCount: { increment: 1 },
        lastUpdated: new Date()
      }
    });

    console.log(`Added customer ${context.customerId} to segment ${config.segmentId}`);
  }

  /**
   * Score lead action
   */
  private async executeScoreLead(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    // Queue lead scoring job
    await addMarketingJob(
      'CALCULATE_LEAD_SCORE',
      {
        customerId: context.customerId,
        contactId: context.contactId,
        vehicleInquiryId: context.contactId,
        scoringReason: config.reason || 'Workflow action',
        scoringData: {
          action: config,
          context: context
        }
      },
      {
        priority: JOB_PRIORITY.HIGH
      }
    );
  }

  /**
   * Create task action
   */
  private async executeCreateTask(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    // This would integrate with a task management system
    // For now, we'll create a simplified task record

    const taskData = {
      title: this.personalizeContent(config.title, context),
      description: this.personalizeContent(config.description || '', context),
      assignedTo: config.assignedTo,
      priority: config.priority || 'medium',
      dueDate: config.dueDate ? new Date(config.dueDate) : null,
      customerId: context.customerId,
      vehicleId: context.vehicleId,
      source: 'workflow_automation',
      workflowContext: context
    };

    // In a real implementation, this would create a task in your task management system
    console.log('Task would be created:', taskData);

    // You could also send an email to the assigned person
    if (config.notifyAssignee && config.assignedTo) {
      await addMarketingJob(
        'SEND_SINGLE_EMAIL',
        {
          to: config.assignedTo,
          subject: `New Task: ${taskData.title}`,
          content: `A new task has been assigned to you:\n\n${taskData.description}`,
          priority: 'high'
        },
        {
          priority: JOB_PRIORITY.HIGH
        }
      );
    }
  }

  /**
   * Wait action (used for delays in workflow)
   */
  private async executeWait(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;
    const delayMinutes = config.minutes || 0;

    if (delayMinutes > 0) {
      console.log(`Wait action: delaying for ${delayMinutes} minutes`);
      // The actual delay is handled by the WorkflowEngine
      // This action is just for logging/tracking
    }
  }

  /**
   * Webhook action
   */
  private async executeWebhook(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const config = action.config;

    const webhookData = {
      event: 'workflow_action',
      actionType: action.type,
      context: context,
      timestamp: new Date().toISOString(),
      data: config.data || {}
    };

    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      console.log(`Webhook sent successfully to ${config.url}`);

    } catch (error) {
      console.error(`Webhook failed:`, error);
      throw error;
    }
  }

  /**
   * Personalize content with dynamic variables
   */
  private personalizeContent(
    content: string,
    context: WorkflowContext,
    additionalVars: Record<string, any> = {}
  ): string {
    if (!content) return content;

    let personalizedContent = content;

    // Merge all available variables
    const variables = {
      ...context.variables,
      ...additionalVars,
      ...context.triggerData
    };

    // Replace template variables like {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      personalizedContent = personalizedContent.replace(regex, String(value || ''));
    });

    // Replace common placeholders
    const placeholderMappings = {
      '{{siteUrl}}': process.env.NEXT_PUBLIC_SITE_URL || 'https://autosalonani.com',
      '{{companyName}}': 'AUTO ANI',
      '{{supportEmail}}': process.env.ADMIN_EMAIL || 'aniautosallon@gmail.com',
      '{{supportPhone}}': '+383 49 204 242',
      '{{currentYear}}': new Date().getFullYear().toString(),
      '{{currentDate}}': new Date().toLocaleDateString(),
      '{{currentTime}}': new Date().toLocaleTimeString()
    };

    Object.entries(placeholderMappings).forEach(([placeholder, replacement]) => {
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return personalizedContent;
  }

  /**
   * Validate an action configuration
   */
  async validateAction(action: WorkflowAction, context: WorkflowContext): Promise<boolean> {
    try {
      switch (action.type) {
        case 'send_email':
          return this.validateEmailAction(action, context);

        case 'send_sms':
          return this.validateSMSAction(action, context);

        case 'add_to_segment':
          return await this.validateSegmentAction(action, context);

        case 'score_lead':
          return this.validateLeadScoringAction(action, context);

        case 'create_task':
          return this.validateTaskAction(action, context);

        case 'wait':
          return this.validateWaitAction(action, context);

        case 'webhook':
          return this.validateWebhookAction(action, context);

        default:
          return false;
      }

    } catch (error) {
      console.error(`Error validating action ${action.type}:`, error);
      return false;
    }
  }

  /**
   * Validate email action
   */
  private validateEmailAction(action: WorkflowAction, context: WorkflowContext): boolean {
    const config = action.config;

    if (!config.subject || !config.content) {
      return false;
    }

    // Check if we can determine recipient email
    if (!config.email && !context.customerId && !context.contactId && !context.triggerData?.email) {
      return false;
    }

    return true;
  }

  /**
   * Validate SMS action
   */
  private validateSMSAction(action: WorkflowAction, context: WorkflowContext): boolean {
    const config = action.config;

    if (!config.message) {
      return false;
    }

    // Check if we can determine phone number
    if (!config.phoneNumber && !context.customerId && !context.contactId && !context.triggerData?.phone) {
      return false;
    }

    return true;
  }

  /**
   * Validate segment action
   */
  private async validateSegmentAction(action: WorkflowAction, context: WorkflowContext): Promise<boolean> {
    const config = action.config;

    if (!config.segmentId) {
      return false;
    }

    if (!context.customerId) {
      return false;
    }

    // Check if segment exists
    const segment = await prisma.customerSegment.findUnique({
      where: { id: config.segmentId }
    });

    return !!segment;
  }

  /**
   * Validate lead scoring action
   */
  private validateLeadScoringAction(action: WorkflowAction, context: WorkflowContext): boolean {
    // Lead scoring requires either customer ID or contact ID
    return !!(context.customerId || context.contactId);
  }

  /**
   * Validate task action
   */
  private validateTaskAction(action: WorkflowAction, context: WorkflowContext): boolean {
    const config = action.config;

    if (!config.title) {
      return false;
    }

    return true;
  }

  /**
   * Validate wait action
   */
  private validateWaitAction(action: WorkflowAction, context: WorkflowContext): boolean {
    const config = action.config;

    if (config.minutes === undefined || config.minutes < 0) {
      return false;
    }

    return true;
  }

  /**
   * Validate webhook action
   */
  private validateWebhookAction(action: WorkflowAction, context: WorkflowContext): boolean {
    const config = action.config;

    if (!config.url) {
      return false;
    }

    try {
      new URL(config.url); // Validate URL format
      return true;
    } catch {
      return false;
    }
  }
}

export default ActionExecutor;