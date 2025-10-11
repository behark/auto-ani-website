// Lead Worker for Marketing Automation
// Processes lead scoring and assignment jobs

// TODO: Install bull package when queue functionality is needed
// import Queue from 'bull';

// Temporary stub
namespace Queue {
  export interface Job<T = any> {
    id: string;
    data: T;
    progress(value: number): void;
  }
}
import { LeadScoringEngine } from '@/lib/scoring/LeadScoringEngine';
import { LeadAssignmentEngine, type AssignmentResult } from '@/lib/assignment/LeadAssignmentEngine';
import { prisma } from '@/lib/database';
import { leadScoringQueue, JOB_TYPES } from '../marketingQueue';
import { EmailService } from '@/lib/email';

interface LeadScoringJobData {
  customerId?: string;
  inquiryId?: string;
  batchCustomerIds?: string[];
  forceRecalculation?: boolean;
  reason?: string;
}

interface LeadAssignmentJobData {
  customerId?: string;
  inquiryId?: string;
  leadScore?: number;
  vehicleType?: string;
  priceRange?: number;
  location?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  qualificationLevel?: string;
  source?: string;
}

interface LeadScoreUpdateJobData {
  email?: string;
  phone?: string;
  customerId?: string;
  action: string;
  points: number;
  metadata?: Record<string, unknown>;
}

/**
 * Process individual lead scoring jobs
 */
leadScoringQueue.process(JOB_TYPES.CALCULATE_LEAD_SCORE, 3, async (job: Queue.Job<LeadScoringJobData>) => {
  const { data } = job;
  console.log(`Processing lead scoring job: ${job.id}`, {
    customerId: data.customerId,
    inquiryId: data.inquiryId,
    reason: data.reason
  });

  try {
    const scoringEngine = new LeadScoringEngine();
    let scoringResult;

    if (data.customerId) {
      // Score existing customer
      scoringResult = await scoringEngine.calculateLeadScore(data.customerId);

      // Save score to database
      await prisma.leadScore.create({
        data: {
          customerId: data.customerId,
          totalScore: scoringResult.totalScore,
          maxPossibleScore: scoringResult.maxPossibleScore,
          scorePercentage: scoringResult.scorePercentage,
          qualificationLevel: scoringResult.qualificationLevel,
          breakdown: scoringResult.breakdown as Record<string, unknown>,
          recommendations: scoringResult.recommendations,
          nextActions: scoringResult.nextActions,
          calculatedAt: new Date()
        }
      });

      console.log(`Lead score calculated for customer ${data.customerId}: ${scoringResult.totalScore} (${scoringResult.qualificationLevel})`);

    } else if (data.inquiryId) {
      // Score inquiry-only lead
      scoringResult = await scoringEngine.calculateInquiryScore(data.inquiryId);

      // Save score to database
      await prisma.leadScore.create({
        data: {
          vehicleInquiryId: data.inquiryId,
          totalScore: scoringResult.totalScore,
          maxPossibleScore: scoringResult.maxPossibleScore,
          scorePercentage: scoringResult.scorePercentage,
          qualificationLevel: scoringResult.qualificationLevel,
          breakdown: scoringResult.breakdown as Record<string, unknown>,
          recommendations: scoringResult.recommendations,
          nextActions: scoringResult.nextActions,
          calculatedAt: new Date()
        }
      });

      console.log(`Lead score calculated for inquiry ${data.inquiryId}: ${scoringResult.totalScore} (${scoringResult.qualificationLevel})`);
    }

    // Queue assignment if lead is qualified
    if (scoringResult && (scoringResult.qualificationLevel === 'QUALIFIED' || scoringResult.qualificationLevel === 'HOT')) {
      await leadScoringQueue.add('assign_lead', {
        customerId: data.customerId,
        inquiryId: data.inquiryId,
        leadScore: scoringResult.totalScore,
        qualificationLevel: scoringResult.qualificationLevel,
        urgency: scoringResult.qualificationLevel === 'QUALIFIED' ? 'HIGH' : 'MEDIUM'
      }, {
        priority: scoringResult.qualificationLevel === 'QUALIFIED' ? 1 : 2,
        delay: scoringResult.qualificationLevel === 'QUALIFIED' ? 0 : 300000 // Immediate for qualified, 5 min for hot
      });
    }

    return {
      success: true,
      customerId: data.customerId,
      inquiryId: data.inquiryId,
      score: scoringResult?.totalScore,
      qualification: scoringResult?.qualificationLevel,
      assignmentQueued: scoringResult && (scoringResult.qualificationLevel === 'QUALIFIED' || scoringResult.qualificationLevel === 'HOT')
    };

  } catch (error) {
    console.error(`Failed to calculate lead score:`, error);
    throw error;
  }
});

/**
 * Process batch lead scoring jobs
 */
leadScoringQueue.process('batch_calculate_scores', 1, async (job: Queue.Job<LeadScoringJobData>) => {
  const { data } = job;
  console.log(`Processing batch lead scoring job: ${job.id}`, {
    customerCount: data.batchCustomerIds?.length,
    reason: data.reason
  });

  try {
    if (!data.batchCustomerIds || data.batchCustomerIds.length === 0) {
      throw new Error('No customer IDs provided for batch scoring');
    }

    const scoringEngine = new LeadScoringEngine();
    const results = await scoringEngine.batchCalculateScores(data.batchCustomerIds);

    // Save all scores to database
    const scoresToSave = Array.from(results.entries()).map(([customerId, scoringResult]) => ({
      customerId,
      totalScore: scoringResult.totalScore,
      maxPossibleScore: scoringResult.maxPossibleScore,
      scorePercentage: scoringResult.scorePercentage,
      qualificationLevel: scoringResult.qualificationLevel,
      breakdown: scoringResult.breakdown as Record<string, unknown>,
      recommendations: scoringResult.recommendations,
      nextActions: scoringResult.nextActions,
      calculatedAt: new Date()
    }));

    // Batch create scores
    await prisma.leadScore.createMany({
      data: scoresToSave
    });

    // Queue assignments for qualified leads
    const qualifiedLeads = Array.from(results.entries()).filter(([, result]) =>
      result.qualificationLevel === 'QUALIFIED' || result.qualificationLevel === 'HOT'
    );

    const assignmentPromises = qualifiedLeads.map(([customerId, result]) =>
      leadScoringQueue.add('assign_lead', {
        customerId,
        leadScore: result.totalScore,
        qualificationLevel: result.qualificationLevel,
        urgency: result.qualificationLevel === 'QUALIFIED' ? 'HIGH' : 'MEDIUM'
      }, {
        priority: result.qualificationLevel === 'QUALIFIED' ? 1 : 2
      })
    );

    await Promise.all(assignmentPromises);

    console.log(`Batch scoring completed: ${results.size} scores calculated, ${qualifiedLeads.length} assignments queued`);

    return {
      success: true,
      processed: results.size,
      qualified: qualifiedLeads.length,
      summary: {
        qualified: Array.from(results.values()).filter(r => r.qualificationLevel === 'QUALIFIED').length,
        hot: Array.from(results.values()).filter(r => r.qualificationLevel === 'HOT').length,
        warm: Array.from(results.values()).filter(r => r.qualificationLevel === 'WARM').length,
        cold: Array.from(results.values()).filter(r => r.qualificationLevel === 'COLD').length
      }
    };

  } catch (error) {
    console.error(`Failed to process batch scoring:`, error);
    throw error;
  }
});

/**
 * Process lead assignment jobs
 */
leadScoringQueue.process('assign_lead', 2, async (job: Queue.Job<LeadAssignmentJobData>) => {
  const { data } = job;
  console.log(`Processing lead assignment job: ${job.id}`, {
    customerId: data.customerId,
    inquiryId: data.inquiryId,
    leadScore: data.leadScore,
    urgency: data.urgency
  });

  try {
    // Check for existing active assignment
    const existingAssignment = await prisma.leadAssignment.findFirst({
      where: {
        OR: [
          { customerId: data.customerId },
          { vehicleInquiryId: data.inquiryId }
        ],
        status: { in: ['ACTIVE', 'CONTACTED', 'FOLLOW_UP'] }
      }
    });

    if (existingAssignment) {
      console.log(`Lead already has active assignment: ${existingAssignment.id}`);
      return {
        success: false,
        reason: 'Lead already assigned',
        existingAssignmentId: existingAssignment.id
      };
    }

    // Initialize assignment engine
    const assignmentEngine = new LeadAssignmentEngine();

    // Perform assignment
    const assignmentResult = await assignmentEngine.assignLead({
      customerId: data.customerId,
      inquiryId: data.inquiryId,
      leadScore: data.leadScore,
      vehicleType: data.vehicleType,
      priceRange: data.priceRange,
      location: data.location,
      urgency: data.urgency,
      source: data.source
    });

    if (!assignmentResult.assignedTo) {
      // Add to queue if no rep available
      await prisma.leadQueue.create({
        data: {
          customerId: data.customerId,
          vehicleInquiryId: data.inquiryId,
          priority: data.urgency || 'MEDIUM',
          reason: assignmentResult.assignmentReason,
          status: 'WAITING',
          attempts: 0
        }
      });

      console.log(`No representative available - added to queue`);

      return {
        success: false,
        reason: 'No representatives available',
        queuedForLater: true
      };
    }

    // Send notification to assigned representative
    await notifyAssignedRepresentative(assignmentResult);

    // Send acknowledgment to customer if email available
    await sendCustomerAcknowledgment(data.customerId, data.inquiryId, assignmentResult);

    // Schedule follow-up reminder
    await scheduleFollowUpReminder(assignmentResult);

    console.log(`Lead assigned to ${assignmentResult.salesRepresentative?.name} (${assignmentResult.assignedTo})`);

    return {
      success: true,
      assignedTo: assignmentResult.assignedTo,
      repName: assignmentResult.salesRepresentative?.name,
      confidence: assignmentResult.confidence,
      dueDate: calculateDueDate(data.urgency || 'MEDIUM')
    };

  } catch (error) {
    console.error(`Failed to assign lead:`, error);
    throw error;
  }
});

/**
 * Process lead score updates (from behavioral events)
 */
leadScoringQueue.process('update_lead_score', 5, async (job: Queue.Job<LeadScoreUpdateJobData>) => {
  const { data } = job;
  console.log(`Processing lead score update: ${job.id}`, {
    customerId: data.customerId,
    action: data.action,
    points: data.points
  });

  try {
    let customerId = data.customerId;

    // Find customer if not provided
    if (!customerId && (data.email || data.phone)) {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: data.email },
            { phone: data.phone }
          ].filter(Boolean)
        }
      });

      customerId = customer?.id;
    }

    if (!customerId) {
      console.log('Customer not found for score update');
      return { success: false, reason: 'Customer not found' };
    }

    // Get latest score
    const latestScore = await prisma.leadScore.findFirst({
      where: { customerId },
      orderBy: { calculatedAt: 'desc' }
    });

    if (!latestScore) {
      // No existing score - queue full calculation
      await leadScoringQueue.add(JOB_TYPES.CALCULATE_LEAD_SCORE, {
        customerId,
        reason: `Triggered by ${data.action}`
      });

      return {
        success: true,
        action: 'queued_full_calculation',
        reason: 'No existing score found'
      };
    }

    // Update score incrementally
    const newScore = Math.max(0, latestScore.totalScore + data.points);
    const newPercentage = (newScore / latestScore.maxPossibleScore) * 100;
    const newQualificationLevel = determineQualificationLevel(newPercentage);

    // Create new score record
    await prisma.leadScore.create({
      data: {
        customerId,
        totalScore: newScore,
        maxPossibleScore: latestScore.maxPossibleScore,
        scorePercentage: newPercentage,
        qualificationLevel: newQualificationLevel,
        breakdown: latestScore.breakdown,
        recommendations: latestScore.recommendations,
        nextActions: latestScore.nextActions,
        calculatedAt: new Date(),
        incrementalUpdate: true,
        updateReason: data.action
      }
    });

    // Check if qualification level changed
    const qualificationChanged = newQualificationLevel !== latestScore.qualificationLevel;
    const becameQualified = newQualificationLevel === 'QUALIFIED' && latestScore.qualificationLevel !== 'QUALIFIED';

    // Queue assignment if newly qualified
    if (becameQualified) {
      await leadScoringQueue.add('assign_lead', {
        customerId,
        leadScore: newScore,
        qualificationLevel: newQualificationLevel,
        urgency: 'HIGH'
      }, {
        priority: 1
      });
    }

    console.log(`Score updated for customer ${customerId}: ${latestScore.totalScore} → ${newScore} (${newQualificationLevel})`);

    return {
      success: true,
      customerId,
      oldScore: latestScore.totalScore,
      newScore,
      qualificationChanged,
      newQualification: newQualificationLevel,
      assignmentQueued: becameQualified
    };

  } catch (error) {
    console.error(`Failed to update lead score:`, error);
    throw error;
  }
});

/**
 * Process follow-up reminders
 */
leadScoringQueue.process('follow_up_reminder', 3, async (job: Queue.Job<{ assignmentId: string; type: string }>) => {
  const { data } = job;
  console.log(`Processing follow-up reminder: ${job.id}`, data);

  try {
    const { assignmentId, type } = data;

    // Get assignment details
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        customer: true,
        salesRepresentative: true,
        vehicleInquiry: {
          include: { vehicle: true }
        }
      }
    });

    if (!assignment) {
      console.log(`Assignment ${assignmentId} not found`);
      return { success: false, reason: 'Assignment not found' };
    }

    // Check if assignment is still active
    if (!['ACTIVE', 'CONTACTED', 'FOLLOW_UP'].includes(assignment.status)) {
      console.log(`Assignment ${assignmentId} is no longer active (${assignment.status})`);
      return { success: false, reason: 'Assignment no longer active' };
    }

    // Send reminder email to sales rep
    const reminderSubject = type === 'initial_contact'
      ? 'Reminder: New Lead Assignment'
      : 'Follow-up Reminder: Customer Contact';

    const reminderContent = generateReminderContent(assignment, type);

    await EmailService.sendCustomEmail({
      to: assignment.salesRepresentative.email,
      subject: reminderSubject,
      content: reminderContent
    });

    // Create follow-up task record
    await prisma.followUpTask.create({
      data: {
        leadAssignmentId: assignmentId,
        salesRepresentativeId: assignment.salesRepresentativeId,
        type: type.toUpperCase(),
        status: 'PENDING',
        dueAt: new Date(),
        description: `${type === 'initial_contact' ? 'Initial contact' : 'Follow-up'} reminder for ${assignment.customer?.firstName || 'customer'}`
      }
    });

    console.log(`Follow-up reminder sent to ${assignment.salesRepresentative.name} for assignment ${assignmentId}`);

    return {
      success: true,
      assignmentId,
      repId: assignment.salesRepresentativeId,
      reminderType: type
    };

  } catch (error) {
    console.error(`Failed to process follow-up reminder:`, error);
    throw error;
  }
});

/**
 * Helper functions
 */

// Notify assigned representative
async function notifyAssignedRepresentative(assignmentResult: AssignmentResult) {
  if (!assignmentResult.salesRepresentative) return;

  const subject = `New Lead Assignment - ${assignmentResult.confidence > 70 ? 'High Priority' : 'Standard Priority'}`;

  const content = `
You have been assigned a new lead!

Customer Information:
- Priority: ${assignmentResult.confidence > 70 ? 'High' : 'Medium'}
- Confidence Score: ${assignmentResult.confidence}%
- Assignment Reason: ${assignmentResult.assignmentReason}

Recommended Actions:
${assignmentResult.recommendedActions.map((action: string) => `• ${action}`).join('\n')}

Please contact this lead as soon as possible.

Best regards,
AUTO ANI Marketing System
  `;

  await EmailService.sendCustomEmail({
    to: assignmentResult.salesRepresentative.email,
    subject,
    content
  });
}

// Send customer acknowledgment
async function sendCustomerAcknowledgment(customerId?: string, inquiryId?: string, assignmentResult?: AssignmentResult) {
  let customerEmail = null;

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { email: true, firstName: true }
    });
    customerEmail = customer?.email;
  } else if (inquiryId) {
    const inquiry = await prisma.vehicleInquiry.findUnique({
      where: { id: inquiryId },
      select: { email: true, name: true }
    });
    customerEmail = inquiry?.email;
  }

  if (customerEmail) {
    const content = `
Faleminderit për interesimin tuaj në AUTO ANI!

Mesazhi juaj është marrë dhe një përfaqësues i shitjeve do t'ju kontaktojë së shpejti.

Përfaqësuesi juaj: ${assignmentResult?.salesRepresentative?.name || 'AUTO ANI Team'}
Telefoni: ${assignmentResult?.salesRepresentative?.phone || '+383 49 204 242'}

Kontakt direkt:
📞 +383 49 204 242
💬 WhatsApp: +383 49 204 242
📧 aniautosallon@gmail.com

Faleminderit,
AUTO ANI Team
    `;

    await EmailService.sendCustomEmail({
      to: customerEmail,
      subject: 'Faleminderit për interesimin - AUTO ANI',
      content
    });
  }
}

// Schedule follow-up reminder
async function scheduleFollowUpReminder(assignmentResult: AssignmentResult) {
  const urgencyDelays = {
    'URGENT': 15 * 60 * 1000,      // 15 minutes
    'HIGH': 1 * 60 * 60 * 1000,   // 1 hour
    'MEDIUM': 4 * 60 * 60 * 1000, // 4 hours
    'LOW': 24 * 60 * 60 * 1000    // 24 hours
  };

  const delay = urgencyDelays['MEDIUM']; // Default to medium

  await leadScoringQueue.add('follow_up_reminder', {
    assignmentId: assignmentResult.assignedTo,
    type: 'initial_contact',
    repId: assignmentResult.salesRepresentative?.id
  }, {
    delay
  });
}

// Generate reminder content
function generateReminderContent(assignment: any, type: string): string {
  const customerName = (assignment.customer as any)?.firstName || (assignment.vehicleInquiry as any)?.name || 'Customer';
  const vehicleInfo = (assignment.vehicleInquiry as any)?.vehicle
    ? `${(assignment.vehicleInquiry as any).vehicle.make} ${(assignment.vehicleInquiry as any).vehicle.model} ${(assignment.vehicleInquiry as any).vehicle.year}`
    : 'General inquiry';

  return `
${type === 'initial_contact' ? 'New Lead Assignment Reminder' : 'Follow-up Reminder'}

Customer: ${customerName}
Vehicle Interest: ${vehicleInfo}
Assignment Date: ${(assignment.assignedAt as Date).toLocaleString()}
Priority: ${assignment.priority as string}

${type === 'initial_contact'
  ? 'This lead has not been contacted yet. Please reach out as soon as possible.'
  : 'Please follow up with this customer to maintain engagement.'
}

Customer Contact:
Email: ${(assignment.customer as any)?.email || (assignment.vehicleInquiry as any)?.email}
Phone: ${(assignment.customer as any)?.phone || (assignment.vehicleInquiry as any)?.phone}

Assignment ID: ${assignment.id as string}
  `;
}

// Determine qualification level from score percentage
function determineQualificationLevel(scorePercentage: number): string {
  if (scorePercentage >= 80) return 'QUALIFIED';
  if (scorePercentage >= 60) return 'HOT';
  if (scorePercentage >= 40) return 'WARM';
  return 'COLD';
}

// Calculate due date based on urgency
function calculateDueDate(urgency: string): Date {
  const now = new Date();
  const hours = {
    'URGENT': 0.25,  // 15 minutes
    'HIGH': 1,       // 1 hour
    'MEDIUM': 4,     // 4 hours
    'LOW': 24        // 24 hours
  }[urgency] || 4;

  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

// Error handling
leadScoringQueue.on('failed', (job: Queue.Job, error: Error) => {
  console.error(`Lead job ${job.id} failed:`, error);
});

leadScoringQueue.on('completed', (job: Queue.Job, result: any) => {
  console.log(`Lead job ${job.id} completed:`, result);
});

console.log('Lead scoring and assignment worker started');

export default leadScoringQueue;