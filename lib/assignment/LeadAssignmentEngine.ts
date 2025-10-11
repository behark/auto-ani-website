// Lead Assignment Engine for AUTO ANI Marketing Automation
// Automatically assigns leads to sales representatives based on criteria

import { prisma } from '@/lib/database';

export interface AssignmentCriteria {
  workloadBalancing: {
    enabled: boolean;
    maxActiveLeads: number;
    considerClosingRate: boolean;
  };
  expertise: {
    vehicleTypeSpecialization: boolean;
    priceRangeSpecialization: boolean;
    languagePreference: boolean;
  };
  availability: {
    respectWorkingHours: boolean;
    considerTimeZone: boolean;
    checkVacationStatus: boolean;
  };
  performance: {
    prioritizeTopPerformers: boolean;
    considerConversionRate: boolean;
    rotationStrategy: 'ROUND_ROBIN' | 'PERFORMANCE_BASED' | 'AVAILABILITY_BASED';
  };
  geographic: {
    assignByLocation: boolean;
    preferLocalReps: boolean;
  };
}

export interface AssignmentResult {
  assignedTo: string | null;
  salesRepresentative?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    expertise: string[];
    currentWorkload: number;
    availability: string;
  };
  assignmentReason: string;
  confidence: number;
  alternativeOptions: Array<{
    repId: string;
    name: string;
    reason: string;
    score: number;
  }>;
  recommendedActions: string[];
  escalationRequired: boolean;
}

export class LeadAssignmentEngine {
  private criteria: AssignmentCriteria;

  constructor(customCriteria?: Partial<AssignmentCriteria>) {
    this.criteria = this.getDefaultAssignmentCriteria();

    if (customCriteria) {
      this.criteria = this.mergeCriteria(this.criteria, customCriteria);
    }
  }

  /**
   * Assign lead to best available sales representative
   */
  async assignLead(leadData: {
    customerId?: string;
    inquiryId?: string;
    leadScore?: number;
    vehicleType?: string;
    priceRange?: number;
    location?: string;
    language?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    source?: string;
  }): Promise<AssignmentResult> {
    try {
      console.log('Starting lead assignment process:', leadData);

      // Get all available sales representatives
      const availableReps = await this.getAvailableSalesReps();

      if (availableReps.length === 0) {
        return this.handleNoAvailableReps(leadData);
      }

      // Score each representative for this lead
      const repScores = await Promise.all(
        availableReps.map((rep: any) => this.scoreRepresentativeForLead(rep, leadData))
      );

      // Sort by score (highest first)
      repScores.sort((a, b) => b.score - a.score);

      const bestRep = repScores[0];
      const alternatives = repScores.slice(1, 4); // Top 3 alternatives

      // Check if assignment is viable
      if (bestRep.score < 30) {
        return this.handleLowConfidenceAssignment(leadData, repScores);
      }

      // Assign the lead
      const assignmentResult = await this.createAssignment(leadData, bestRep);

      // Update representative workload
      await this.updateRepWorkload(bestRep.rep.id, 1);

      console.log(`Lead assigned to ${bestRep.rep.name} (Score: ${bestRep.score})`);

      return {
        assignedTo: bestRep.rep.id,
        salesRepresentative: {
          id: bestRep.rep.id,
          name: bestRep.rep.name,
          email: bestRep.rep.email,
          phone: bestRep.rep.phone,
          expertise: bestRep.rep.expertise || [],
          currentWorkload: bestRep.rep.currentActiveLeads + 1,
          availability: bestRep.rep.availability
        },
        assignmentReason: bestRep.reason,
        confidence: bestRep.score,
        alternativeOptions: alternatives.map(alt => ({
          repId: alt.rep.id,
          name: alt.rep.name,
          reason: alt.reason,
          score: alt.score
        })),
        recommendedActions: this.generateRecommendedActions(leadData, bestRep),
        escalationRequired: false
      };

    } catch (error) {
      console.error('Error in lead assignment:', error);
      throw error;
    }
  }

  /**
   * Reassign lead to different representative
   */
  async reassignLead(assignmentId: string, reason: string, newRepId?: string): Promise<AssignmentResult> {
    try {
      // Get current assignment
      const currentAssignment = await prisma.leadAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          customer: true,
          vehicleInquiry: true,
          salesRepresentative: true
        }
      });

      if (!currentAssignment) {
        throw new Error('Assignment not found');
      }

      // Update old rep workload
      if (currentAssignment.salesRepresentativeId) {
        await this.updateRepWorkload(currentAssignment.salesRepresentativeId, -1);
      }

      // Find new representative
      let newAssignment: AssignmentResult;

      if (newRepId) {
        // Manual reassignment to specific rep
        const newRep = await prisma.salesRepresentative.findUnique({
          where: { id: newRepId }
        });

        if (!newRep) {
          throw new Error('Specified sales representative not found');
        }

        newAssignment = await this.createSpecificAssignment(currentAssignment, newRep, reason);
      } else {
        // Automatic reassignment
        const leadData = {
          customerId: currentAssignment.customerId,
          inquiryId: currentAssignment.vehicleInquiryId,
          leadScore: currentAssignment.leadScore,
          urgency: 'HIGH' as const // Reassignments are typically urgent
        };

        newAssignment = await this.assignLead(leadData);
      }

      // Update assignment record
      await prisma.leadAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'REASSIGNED',
          reassignedAt: new Date(),
          reassignmentReason: reason
        }
      });

      return newAssignment;

    } catch (error) {
      console.error('Error in lead reassignment:', error);
      throw error;
    }
  }

  /**
   * Get available sales representatives
   */
  private async getAvailableSalesReps() {
    const now = new Date();
    const currentHour = now.getHours();

    const whereClause: any = {
      isActive: true,
      isAvailable: true
    };

    // Respect working hours if enabled
    if (this.criteria.availability.respectWorkingHours) {
      whereClause.workingHours = {
        some: {
          dayOfWeek: now.getDay(),
          startHour: { lte: currentHour },
          endHour: { gte: currentHour }
        }
      };
    }

    return await prisma.salesRepresentative.findMany({
      where: whereClause,
      include: {
        leadAssignments: {
          where: {
            status: { in: ['ACTIVE', 'CONTACTED', 'FOLLOW_UP'] }
          }
        },
        performance: {
          orderBy: { month: 'desc' },
          take: 3 // Last 3 months
        }
      }
    });
  }

  /**
   * Score a representative for a specific lead
   */
  private async scoreRepresentativeForLead(rep: any, leadData: any): Promise<{
    rep: any;
    score: number;
    reason: string;
  }> {
    let score = 0;
    const reasons: string[] = [];

    // Workload balancing
    if (this.criteria.workloadBalancing.enabled) {
      const currentWorkload = rep.leadAssignments?.length || 0;
      const workloadScore = Math.max(0, 100 - (currentWorkload / this.criteria.workloadBalancing.maxActiveLeads) * 100);
      score += workloadScore * 0.3;

      if (currentWorkload < this.criteria.workloadBalancing.maxActiveLeads * 0.5) {
        reasons.push('Low workload');
      } else if (currentWorkload >= this.criteria.workloadBalancing.maxActiveLeads) {
        score -= 50; // Penalty for overload
        reasons.push('Workload at capacity');
      }
    }

    // Expertise matching
    if (this.criteria.expertise.vehicleTypeSpecialization && leadData.vehicleType) {
      const hasVehicleExpertise = rep.expertise?.includes(leadData.vehicleType) ||
                                  rep.expertise?.includes('ALL_VEHICLES');
      if (hasVehicleExpertise) {
        score += 25;
        reasons.push(`${leadData.vehicleType} specialist`);
      }
    }

    if (this.criteria.expertise.priceRangeSpecialization && leadData.priceRange) {
      const priceCategory = this.categorizePriceRange(leadData.priceRange);
      const hasPriceExpertise = rep.expertise?.includes(priceCategory);
      if (hasPriceExpertise) {
        score += 20;
        reasons.push(`${priceCategory} specialist`);
      }
    }

    if (this.criteria.expertise.languagePreference && leadData.language) {
      const speaksLanguage = rep.languages?.includes(leadData.language) ||
                             rep.languages?.includes('MULTILINGUAL');
      if (speaksLanguage) {
        score += 15;
        reasons.push(`Speaks ${leadData.language}`);
      }
    }

    // Performance scoring
    if (this.criteria.performance.considerConversionRate && rep.performance?.length > 0) {
      const avgConversionRate = rep.performance.reduce((sum: number, perf: any) =>
        sum + perf.conversionRate, 0) / rep.performance.length;

      score += avgConversionRate; // Add conversion rate percentage directly

      if (avgConversionRate > 30) {
        reasons.push('High conversion rate');
      }
    }

    // Geographic preference
    if (this.criteria.geographic.assignByLocation && leadData.location && rep.territory) {
      const isInTerritory = rep.territory.some((area: string) =>
        leadData.location!.toLowerCase().includes(area.toLowerCase())
      );

      if (isInTerritory) {
        score += 15;
        reasons.push('Local territory match');
      }
    }

    // Urgency handling
    if (leadData.urgency) {
      const urgencyMultipliers = {
        'URGENT': 1.5,
        'HIGH': 1.3,
        'MEDIUM': 1.1,
        'LOW': 1.0
      };

      score *= urgencyMultipliers[leadData.urgency as keyof typeof urgencyMultipliers];

      if (leadData.urgency === 'URGENT' && rep.canHandleUrgent) {
        score += 20;
        reasons.push('Handles urgent leads');
      }
    }

    // Lead score bonus (high-value leads to top performers)
    if (leadData.leadScore && leadData.leadScore > 70) {
      if (rep.performance?.length > 0) {
        const isTopPerformer = rep.performance[0]?.conversionRate > 25;
        if (isTopPerformer) {
          score += 15;
          reasons.push('High-value lead for top performer');
        }
      }
    }

    // Availability bonus
    if (rep.isAvailable && rep.lastActiveAt) {
      const lastActiveHours = (Date.now() - new Date(rep.lastActiveAt).getTime()) / (1000 * 60 * 60);
      if (lastActiveHours < 1) {
        score += 10;
        reasons.push('Recently active');
      }
    }

    // Round robin consideration
    if (this.criteria.performance.rotationStrategy === 'ROUND_ROBIN') {
      const timeSinceLastAssignment = rep.lastAssignmentAt ?
        (Date.now() - new Date(rep.lastAssignmentAt).getTime()) / (1000 * 60 * 60) : 999;

      score += Math.min(20, timeSinceLastAssignment); // Bonus for longer wait

      if (timeSinceLastAssignment > 4) {
        reasons.push('Due for assignment (round robin)');
      }
    }

    return {
      rep,
      score: Math.round(score),
      reason: reasons.join(', ') || 'Available representative'
    };
  }

  /**
   * Create assignment record
   */
  private async createAssignment(leadData: any, repData: any) {
    const assignment = await prisma.leadAssignment.create({
      data: {
        customerId: leadData.customerId,
        vehicleInquiryId: leadData.inquiryId,
        salesRepresentativeId: repData.rep.id,
        leadScore: leadData.leadScore || 0,
        assignmentReason: repData.reason,
        confidence: repData.score,
        status: 'ACTIVE',
        priority: this.determinePriority(leadData),
        assignedAt: new Date(),
        dueAt: this.calculateDueDate(leadData.urgency)
      }
    });

    // Update rep's last assignment time
    await prisma.salesRepresentative.update({
      where: { id: repData.rep.id },
      data: { lastAssignmentAt: new Date() }
    });

    return assignment;
  }

  /**
   * Handle case when no representatives are available
   */
  private handleNoAvailableReps(leadData: any): AssignmentResult {
    return {
      assignedTo: null,
      assignmentReason: 'No sales representatives available',
      confidence: 0,
      alternativeOptions: [],
      recommendedActions: [
        'Add lead to queue for next available representative',
        'Send automated acknowledgment email',
        'Escalate to sales manager if urgent',
        'Schedule callback for next business day'
      ],
      escalationRequired: leadData.urgency === 'URGENT'
    };
  }

  /**
   * Handle low confidence assignments
   */
  private handleLowConfidenceAssignment(leadData: any, repScores: any[]): AssignmentResult {
    const bestAvailable = repScores[0];

    return {
      assignedTo: bestAvailable.rep.id,
      salesRepresentative: {
        id: bestAvailable.rep.id,
        name: bestAvailable.rep.name,
        email: bestAvailable.rep.email,
        phone: bestAvailable.rep.phone,
        expertise: bestAvailable.rep.expertise || [],
        currentWorkload: bestAvailable.rep.currentActiveLeads,
        availability: bestAvailable.rep.availability
      },
      assignmentReason: 'Best available option (low confidence)',
      confidence: bestAvailable.score,
      alternativeOptions: repScores.slice(1, 3).map(alt => ({
        repId: alt.rep.id,
        name: alt.rep.name,
        reason: alt.reason,
        score: alt.score
      })),
      recommendedActions: [
        'Monitor assignment closely',
        'Consider reassignment if no contact within 2 hours',
        'Provide additional lead context to representative',
        'Set follow-up reminder for 4 hours'
      ],
      escalationRequired: leadData.urgency === 'URGENT' || leadData.leadScore > 80
    };
  }

  /**
   * Create specific assignment (for manual reassignment)
   */
  private async createSpecificAssignment(assignment: any, newRep: any, reason: string): Promise<AssignmentResult> {
    await prisma.leadAssignment.create({
      data: {
        customerId: assignment.customerId,
        vehicleInquiryId: assignment.vehicleInquiryId,
        salesRepresentativeId: newRep.id,
        leadScore: assignment.leadScore,
        assignmentReason: `Manual reassignment: ${reason}`,
        confidence: 75, // Default confidence for manual assignments
        status: 'ACTIVE',
        priority: assignment.priority,
        assignedAt: new Date(),
        isReassignment: true
      }
    });

    await this.updateRepWorkload(newRep.id, 1);

    return {
      assignedTo: newRep.id,
      salesRepresentative: {
        id: newRep.id,
        name: newRep.name,
        email: newRep.email,
        phone: newRep.phone,
        expertise: newRep.expertise || [],
        currentWorkload: newRep.currentActiveLeads + 1,
        availability: newRep.availability
      },
      assignmentReason: `Manual reassignment: ${reason}`,
      confidence: 75,
      alternativeOptions: [],
      recommendedActions: [
        'Notify new representative immediately',
        'Provide full lead history and context',
        'Set urgent follow-up reminder'
      ],
      escalationRequired: false
    };
  }

  /**
   * Update representative workload
   */
  private async updateRepWorkload(repId: string, change: number) {
    await prisma.salesRepresentative.update({
      where: { id: repId },
      data: {
        currentActiveLeads: { increment: change }
      }
    });
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(leadData: any, repData: any): string[] {
    const actions: string[] = [];

    if (leadData.urgency === 'URGENT') {
      actions.push('Contact lead within 15 minutes');
      actions.push('Send immediate SMS acknowledgment');
    } else if (leadData.urgency === 'HIGH') {
      actions.push('Contact lead within 1 hour');
      actions.push('Send email acknowledgment');
    } else {
      actions.push('Contact lead within 4 hours');
      actions.push('Send welcome email sequence');
    }

    if (leadData.leadScore && leadData.leadScore > 70) {
      actions.push('Prepare financing options');
      actions.push('Schedule test drive if applicable');
    }

    if (leadData.vehicleType) {
      actions.push(`Focus on ${leadData.vehicleType} inventory`);
    }

    return actions;
  }

  /**
   * Utility functions
   */
  private categorizePriceRange(price: number): string {
    if (price < 10000) return 'BUDGET';
    if (price < 25000) return 'MID_RANGE';
    if (price < 50000) return 'PREMIUM';
    return 'LUXURY';
  }

  private determinePriority(leadData: any): string {
    if (leadData.urgency === 'URGENT' || leadData.leadScore > 80) return 'HIGH';
    if (leadData.urgency === 'HIGH' || leadData.leadScore > 60) return 'MEDIUM';
    return 'LOW';
  }

  private calculateDueDate(urgency?: string): Date {
    const now = new Date();
    const hoursMap = {
      'URGENT': 0.25, // 15 minutes
      'HIGH': 1,
      'MEDIUM': 4,
      'LOW': 24
    };

    const hours = hoursMap[urgency as keyof typeof hoursMap] || hoursMap['MEDIUM'];

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Get default assignment criteria
   */
  private getDefaultAssignmentCriteria(): AssignmentCriteria {
    return {
      workloadBalancing: {
        enabled: true,
        maxActiveLeads: 15,
        considerClosingRate: true
      },
      expertise: {
        vehicleTypeSpecialization: true,
        priceRangeSpecialization: true,
        languagePreference: true
      },
      availability: {
        respectWorkingHours: true,
        considerTimeZone: true,
        checkVacationStatus: true
      },
      performance: {
        prioritizeTopPerformers: true,
        considerConversionRate: true,
        rotationStrategy: 'PERFORMANCE_BASED'
      },
      geographic: {
        assignByLocation: true,
        preferLocalReps: true
      }
    };
  }

  /**
   * Merge criteria
   */
  private mergeCriteria(defaultCriteria: AssignmentCriteria, customCriteria: Partial<AssignmentCriteria>): AssignmentCriteria {
    return {
      workloadBalancing: { ...defaultCriteria.workloadBalancing, ...customCriteria.workloadBalancing },
      expertise: { ...defaultCriteria.expertise, ...customCriteria.expertise },
      availability: { ...defaultCriteria.availability, ...customCriteria.availability },
      performance: { ...defaultCriteria.performance, ...customCriteria.performance },
      geographic: { ...defaultCriteria.geographic, ...customCriteria.geographic }
    };
  }
}

export default LeadAssignmentEngine;