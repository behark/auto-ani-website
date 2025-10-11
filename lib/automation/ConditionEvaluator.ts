// Condition Evaluator for Marketing Automation Workflows
// Evaluates complex conditions to determine if workflow should execute

import { prisma } from '@/lib/database';
import { WorkflowContext, WorkflowCondition } from './WorkflowEngine';

export class ConditionEvaluator {
  /**
   * Evaluate an array of conditions with logical operators
   */
  async evaluateConditions(
    conditions: WorkflowCondition[],
    context: WorkflowContext
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always execute
    }

    try {
      const results: boolean[] = [];
      const operators: string[] = [];

      // Evaluate each condition
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        const result = await this.evaluateCondition(condition, context);

        results.push(result);

        if (condition.logicalOperator && i < conditions.length - 1) {
          operators.push(condition.logicalOperator);
        }
      }

      // Combine results using logical operators
      return this.combineResults(results, operators);

    } catch (error) {
      console.error('Error evaluating conditions:', error);
      return false; // Fail safe - don't execute if conditions can't be evaluated
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: WorkflowCondition,
    context: WorkflowContext
  ): Promise<boolean> {
    console.log(`Evaluating condition: ${condition.type} ${condition.property} ${condition.operator} ${condition.value}`);

    switch (condition.type) {
      case 'customer_property':
        return await this.evaluateCustomerProperty(condition, context);

      case 'event_property':
        return this.evaluateEventProperty(condition, context);

      case 'date_condition':
        return this.evaluateDateCondition(condition, context);

      case 'behavior_condition':
        return await this.evaluateBehaviorCondition(condition, context);

      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Evaluate customer property conditions
   */
  private async evaluateCustomerProperty(
    condition: WorkflowCondition,
    context: WorkflowContext
  ): Promise<boolean> {
    if (!context.customerId && !context.contactId) {
      return false;
    }

    try {
      // Get customer data
      let customerData: any = null;

      if (context.customerId) {
        customerData = await prisma.customer.findUnique({
          where: { id: context.customerId },
          include: {
            salesTransactions: true,
            loyaltyProgram: true,
            customerLifecycle: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        });
      } else if (context.contactId) {
        // Get contact data from vehicle inquiry
        const contact = await prisma.vehicleInquiry.findUnique({
          where: { id: context.contactId }
        });

        if (contact) {
          customerData = {
            email: contact.email,
            firstName: contact.name.split(' ')[0],
            leadScore: contact.leadScore,
            source: contact.source,
            createdAt: contact.createdAt
          };
        }
      }

      if (!customerData) {
        return false;
      }

      return this.compareValues(
        this.getNestedProperty(customerData, condition.property),
        condition.value,
        condition.operator
      );

    } catch (error) {
      console.error('Error evaluating customer property:', error);
      return false;
    }
  }

  /**
   * Evaluate event property conditions
   */
  private evaluateEventProperty(
    condition: WorkflowCondition,
    context: WorkflowContext
  ): boolean {
    if (!context.triggerData) {
      return false;
    }

    const eventValue = this.getNestedProperty(context.triggerData, condition.property);
    return this.compareValues(eventValue, condition.value, condition.operator);
  }

  /**
   * Evaluate date-based conditions
   */
  private evaluateDateCondition(
    condition: WorkflowCondition,
    context: WorkflowContext
  ): boolean {
    const now = new Date();
    let dateValue: Date;

    switch (condition.property) {
      case 'current_time':
        dateValue = now;
        break;

      case 'trigger_time':
        dateValue = new Date(context.triggerData?.timestamp || now);
        break;

      case 'day_of_week':
        return this.compareValues(now.getDay(), condition.value, condition.operator);

      case 'hour_of_day':
        return this.compareValues(now.getHours(), condition.value, condition.operator);

      case 'days_since_trigger':
        if (context.triggerData?.timestamp) {
          const triggerDate = new Date(context.triggerData.timestamp);
          const daysDiff = Math.floor((now.getTime() - triggerDate.getTime()) / (1000 * 60 * 60 * 24));
          return this.compareValues(daysDiff, condition.value, condition.operator);
        }
        return false;

      default:
        return false;
    }

    return this.compareValues(dateValue, new Date(condition.value), condition.operator);
  }

  /**
   * Evaluate behavior-based conditions
   */
  private async evaluateBehaviorCondition(
    condition: WorkflowCondition,
    context: WorkflowContext
  ): Promise<boolean> {
    if (!context.customerId && !context.contactId) {
      return false;
    }

    try {
      switch (condition.property) {
        case 'email_opens_last_30_days':
          const emailOpens = await this.getEmailEngagement(context, 'opened', 30);
          return this.compareValues(emailOpens, condition.value, condition.operator);

        case 'email_clicks_last_30_days':
          const emailClicks = await this.getEmailEngagement(context, 'clicked', 30);
          return this.compareValues(emailClicks, condition.value, condition.operator);

        case 'website_visits_last_30_days':
          const visits = await this.getWebsiteVisits(context, 30);
          return this.compareValues(visits, condition.value, condition.operator);

        case 'vehicle_views_last_30_days':
          const vehicleViews = await this.getVehicleViews(context, 30);
          return this.compareValues(vehicleViews, condition.value, condition.operator);

        case 'inquiries_made':
          const inquiries = await this.getInquiriesMade(context);
          return this.compareValues(inquiries, condition.value, condition.operator);

        case 'test_drives_scheduled':
          const testDrives = await this.getTestDrivesScheduled(context);
          return this.compareValues(testDrives, condition.value, condition.operator);

        case 'lead_score':
          const leadScore = await this.getLeadScore(context);
          return this.compareValues(leadScore, condition.value, condition.operator);

        case 'purchase_history':
          const purchases = await this.getPurchaseHistory(context);
          return this.compareValues(purchases.length, condition.value, condition.operator);

        case 'lifetime_value':
          const ltv = await this.getLifetimeValue(context);
          return this.compareValues(ltv, condition.value, condition.operator);

        default:
          console.warn(`Unknown behavior condition: ${condition.property}`);
          return false;
      }

    } catch (error) {
      console.error('Error evaluating behavior condition:', error);
      return false;
    }
  }

  /**
   * Helper: Get email engagement data
   */
  private async getEmailEngagement(
    context: WorkflowContext,
    action: 'opened' | 'clicked',
    days: number
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const status = action === 'opened' ? 'OPENED' : 'CLICKED';

    const count = await prisma.emailLog.count({
      where: {
        OR: [
          { customerId: context.customerId },
          { email: context.triggerData?.email }
        ],
        status,
        sentAt: { gte: since }
      }
    });

    return count;
  }

  /**
   * Helper: Get website visits
   */
  private async getWebsiteVisits(context: WorkflowContext, days: number): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const count = await prisma.searchAnalytics.count({
      where: {
        OR: [
          { userId: context.customerId },
          { sessionId: context.sessionId }
        ],
        createdAt: { gte: since }
      }
    });

    return count;
  }

  /**
   * Helper: Get vehicle views
   */
  private async getVehicleViews(context: WorkflowContext, days: number): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const count = await prisma.recentlyViewed.count({
      where: {
        OR: [
          { userId: context.customerId },
          { sessionId: context.sessionId }
        ],
        lastViewedAt: { gte: since }
      }
    });

    return count;
  }

  /**
   * Helper: Get inquiries made
   */
  private async getInquiriesMade(context: WorkflowContext): Promise<number> {
    const count = await prisma.vehicleInquiry.count({
      where: {
        OR: [
          { id: context.contactId },
          { email: context.triggerData?.email }
        ]
      }
    });

    return count;
  }

  /**
   * Helper: Get test drives scheduled
   */
  private async getTestDrivesScheduled(context: WorkflowContext): Promise<number> {
    const count = await prisma.appointment.count({
      where: {
        OR: [
          { customerEmail: context.triggerData?.email },
          { customerPhone: context.triggerData?.phone }
        ],
        type: 'TEST_DRIVE'
      }
    });

    return count;
  }

  /**
   * Helper: Get lead score
   */
  private async getLeadScore(context: WorkflowContext): Promise<number> {
    const leadScore = await prisma.leadScore.findFirst({
      where: {
        OR: [
          { customerId: context.customerId },
          { vehicleInquiryId: context.contactId }
        ]
      }
    });

    return leadScore?.totalScore || 0;
  }

  /**
   * Helper: Get purchase history
   */
  private async getPurchaseHistory(context: WorkflowContext): Promise<any[]> {
    if (!context.customerId) return [];

    const purchases = await prisma.salesTransaction.findMany({
      where: { customerId: context.customerId }
    });

    return purchases;
  }

  /**
   * Helper: Get lifetime value
   */
  private async getLifetimeValue(context: WorkflowContext): Promise<number> {
    if (!context.customerId) return 0;

    const customer = await prisma.customer.findUnique({
      where: { id: context.customerId }
    });

    return customer?.lifetimeValue || 0;
  }

  /**
   * Helper: Get nested property from object
   */
  private getNestedProperty(obj: any, property: string): any {
    return property.split('.').reduce((o, p) => o?.[p], obj);
  }

  /**
   * Helper: Compare values using operator
   */
  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;

      case 'not_equals':
        return actual !== expected;

      case 'greater_than':
        return Number(actual) > Number(expected);

      case 'less_than':
        return Number(actual) < Number(expected);

      case 'contains':
        if (typeof actual === 'string') {
          return actual.toLowerCase().includes(String(expected).toLowerCase());
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;

      case 'in':
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return false;

      case 'not_in':
        if (Array.isArray(expected)) {
          return !expected.includes(actual);
        }
        return true;

      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Helper: Combine boolean results with logical operators
   */
  private combineResults(results: boolean[], operators: string[]): boolean {
    if (results.length === 0) return true;
    if (results.length === 1) return results[0];

    let combinedResult = results[0];

    for (let i = 0; i < operators.length; i++) {
      const operator = operators[i];
      const nextResult = results[i + 1];

      if (operator === 'AND') {
        combinedResult = combinedResult && nextResult;
      } else if (operator === 'OR') {
        combinedResult = combinedResult || nextResult;
      }
    }

    return combinedResult;
  }

  /**
   * Validate a condition configuration
   */
  validateCondition(condition: WorkflowCondition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!condition.type) {
      errors.push('Condition type is required');
    }

    if (!condition.property) {
      errors.push('Condition property is required');
    }

    if (!condition.operator) {
      errors.push('Condition operator is required');
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push('Condition value is required');
    }

    const validTypes = ['customer_property', 'event_property', 'date_condition', 'behavior_condition'];
    if (condition.type && !validTypes.includes(condition.type)) {
      errors.push(`Invalid condition type: ${condition.type}`);
    }

    const validOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in'];
    if (condition.operator && !validOperators.includes(condition.operator)) {
      errors.push(`Invalid operator: ${condition.operator}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ConditionEvaluator;