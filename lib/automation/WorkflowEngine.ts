// Workflow Automation Engine for AUTO ANI Marketing
// Processes triggers, evaluates conditions, and executes actions

import { prisma } from '@/lib/database';
import { addMarketingJob, JOB_TYPES, JOB_PRIORITY } from '@/lib/queues/marketingQueue';
import { TriggerManager } from './TriggerManager';
import { ConditionEvaluator } from './ConditionEvaluator';
import { ActionExecutor } from './ActionExecutor';

export interface WorkflowContext {
  customerId?: string;
  contactId?: string;
  vehicleId?: string;
  sessionId?: string;
  triggerData: any;
  variables: Record<string, any>;
}

export interface WorkflowCondition {
  type: 'customer_property' | 'event_property' | 'date_condition' | 'behavior_condition';
  property: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'add_to_segment' | 'score_lead' | 'create_task' | 'wait' | 'webhook';
  config: any;
  delayMinutes?: number;
}

export class WorkflowEngine {
  private triggerManager: TriggerManager;
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;

  constructor() {
    this.triggerManager = new TriggerManager();
    this.conditionEvaluator = new ConditionEvaluator();
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * Process a trigger event and execute matching workflows
   */
  async processTrigger(
    triggerType: string,
    triggerData: any,
    context: Partial<WorkflowContext> = {}
  ): Promise<void> {
    try {
      console.log(`Processing trigger: ${triggerType}`, { triggerData, context });

      // Find all active workflows that match this trigger
      const workflows = await prisma.workflowRule.findMany({
        where: {
          isActive: true,
          triggerType: triggerType as any,
        }
      });

      console.log(`Found ${workflows.length} workflows for trigger ${triggerType}`);

      // Process each workflow
      for (const workflow of workflows) {
        try {
          await this.executeWorkflow(workflow, {
            ...context,
            triggerData,
            variables: {},
          } as WorkflowContext);
        } catch (error) {
          console.error(`Error executing workflow ${workflow.id}:`, error);

          // Update failure count
          await prisma.workflowRule.update({
            where: { id: workflow.id },
            data: {
              failureCount: { increment: 1 }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing trigger:', error);
      throw error;
    }
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(
    workflow: any,
    context: WorkflowContext
  ): Promise<void> {
    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        customerId: context.customerId,
        contactId: context.contactId,
        vehicleId: context.vehicleId,
        sessionId: context.sessionId,
        status: 'RUNNING',
        executionData: {
          triggerData: context.triggerData,
          variables: context.variables,
          startedAt: new Date().toISOString(),
        }
      }
    });

    try {
      console.log(`Executing workflow ${workflow.name} (${workflow.id})`);

      // Check if customer has reached max executions for this workflow
      if (workflow.maxExecutions && context.customerId) {
        const executionCount = await prisma.workflowExecution.count({
          where: {
            workflowId: workflow.id,
            customerId: context.customerId,
            status: 'COMPLETED'
          }
        });

        if (executionCount >= workflow.maxExecutions) {
          console.log(`Customer ${context.customerId} has reached max executions for workflow ${workflow.id}`);
          await this.markExecutionCompleted(execution.id, 'Max executions reached');
          return;
        }
      }

      // Evaluate conditions if they exist
      if (workflow.conditions && Array.isArray(workflow.conditions)) {
        const conditionsMet = await this.conditionEvaluator.evaluateConditions(
          workflow.conditions as WorkflowCondition[],
          context
        );

        if (!conditionsMet) {
          console.log(`Conditions not met for workflow ${workflow.id}`);
          await this.markExecutionCompleted(execution.id, 'Conditions not met');
          return;
        }
      }

      // Apply delay if specified
      if (workflow.delayMinutes > 0) {
        console.log(`Delaying workflow ${workflow.id} by ${workflow.delayMinutes} minutes`);

        // Schedule delayed execution
        await addMarketingJob(
          'EXECUTE_WORKFLOW',
          {
            workflowId: workflow.id,
            executionId: execution.id,
            context
          },
          {
            delay: workflow.delayMinutes * 60 * 1000, // Convert to milliseconds
            priority: JOB_PRIORITY.NORMAL
          }
        );

        return;
      }

      // Execute actions
      await this.executeActions(workflow.actions as WorkflowAction[], context, execution.id);

      // Mark execution as completed
      await this.markExecutionCompleted(execution.id, 'Workflow completed successfully');

      // Update workflow analytics
      await prisma.workflowRule.update({
        where: { id: workflow.id },
        data: {
          executionCount: { increment: 1 },
          successCount: { increment: 1 },
          lastTriggered: new Date()
        }
      });

    } catch (error) {
      console.error(`Error executing workflow ${workflow.id}:`, error);

      // Mark execution as failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });

      // Update workflow failure count
      await prisma.workflowRule.update({
        where: { id: workflow.id },
        data: {
          failureCount: { increment: 1 }
        }
      });

      throw error;
    }
  }

  /**
   * Execute workflow actions sequentially
   */
  private async executeActions(
    actions: WorkflowAction[],
    context: WorkflowContext,
    executionId: string
  ): Promise<void> {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      try {
        console.log(`Executing action ${i + 1}/${actions.length}: ${action.type}`);

        // Update execution step
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            stepIndex: i,
            executionData: {
              ...context,
              currentAction: action.type,
              currentStep: i + 1,
              totalSteps: actions.length
            }
          }
        });

        // Handle action delay
        if (action.delayMinutes && action.delayMinutes > 0) {
          console.log(`Delaying action by ${action.delayMinutes} minutes`);

          // Schedule remaining actions for later
          await addMarketingJob(
            'EXECUTE_WORKFLOW',
            {
              executionId,
              context,
              actions: actions.slice(i),
              startFromStep: i
            },
            {
              delay: action.delayMinutes * 60 * 1000,
              priority: JOB_PRIORITY.NORMAL
            }
          );

          return; // Exit early, remaining actions will be executed later
        }

        // Execute the action
        await this.actionExecutor.executeAction(action, context);

      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        throw error;
      }
    }
  }

  /**
   * Mark workflow execution as completed
   */
  private async markExecutionCompleted(executionId: string, message: string): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        executionData: {
          completedMessage: message,
          completedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Resume a delayed workflow execution
   */
  async resumeWorkflow(
    executionId: string,
    actions: WorkflowAction[],
    context: WorkflowContext,
    startFromStep: number = 0
  ): Promise<void> {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId }
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      // Continue executing actions from the specified step
      await this.executeActions(actions.slice(startFromStep), context, executionId);

      // Mark as completed
      await this.markExecutionCompleted(executionId, 'Delayed workflow completed');

    } catch (error) {
      console.error(`Error resuming workflow execution ${executionId}:`, error);

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(workflowId: string): Promise<any> {
    const workflow = await prisma.workflowRule.findUnique({
      where: { id: workflowId },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const totalExecutions = workflow.executions.length;
    const completedExecutions = workflow.executions.filter((e: any) => e.status === 'COMPLETED').length;
    const failedExecutions = workflow.executions.filter((e: any) => e.status === 'FAILED').length;

    return {
      id: workflow.id,
      name: workflow.name,
      isActive: workflow.isActive,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      lastTriggered: workflow.lastTriggered,
      recentExecutions: workflow.executions.slice(0, 10)
    };
  }

  /**
   * Test a workflow with sample data
   */
  async testWorkflow(workflowId: string, testData: any): Promise<any> {
    const workflow = await prisma.workflowRule.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Create test context
    const testContext: WorkflowContext = {
      customerId: testData.customerId || 'test-customer',
      triggerData: testData.triggerData || {},
      variables: testData.variables || {}
    };

    console.log(`Testing workflow ${workflow.name} with test data`);

    try {
      // Test condition evaluation
      let conditionResult = true;
      if (workflow.conditions && Array.isArray(workflow.conditions)) {
        conditionResult = await this.conditionEvaluator.evaluateConditions(
          workflow.conditions as WorkflowCondition[],
          testContext
        );
      }

      // Test action validation (without actually executing)
      const actionResults = [];
      if (workflow.actions && Array.isArray(workflow.actions)) {
        for (const action of workflow.actions as WorkflowAction[]) {
          try {
            const isValid = await this.actionExecutor.validateAction(action, testContext);
            actionResults.push({
              type: action.type,
              isValid,
              config: action.config
            });
          } catch (error) {
            actionResults.push({
              type: action.type,
              isValid: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        conditionResult,
        actionResults,
        testData: testContext,
        wouldExecute: conditionResult && actionResults.every(a => a.isValid)
      };

    } catch (error) {
      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        error: error instanceof Error ? error.message : String(error),
        testData: testContext
      };
    }
  }
}

export default WorkflowEngine;