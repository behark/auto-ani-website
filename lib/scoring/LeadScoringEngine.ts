// Lead Scoring Engine for AUTO ANI Marketing Automation
// Calculates lead scores based on behavioral, demographic, and engagement data

import { prisma } from '@/lib/database';

interface ScoreBreakdown {
  engagement: number;
  behavioral: number;
  vehicleInterest: number;
  temporal: number;
  demographic: number;
}

interface CustomerWithIncludes {
  id: string;
  birthDate?: Date | null;
  address?: string | null;
  vehicleInquiries: Array<{
    id: string;
    inquiryType: string;
    createdAt?: string | Date;
    vehicle?: {
      id: string;
      type?: string;
      price?: number;
    } | null;
  }>;
  emailLogs: Array<{
    id: string;
    openedAt?: Date | null;
    clickedAt?: Date | null;
    sentAt: Date;
  }>;
  smsLogs: Array<{
    id: string;
    clickedAt?: Date | null;
    sentAt: Date;
  }>;
  websiteActivity: Array<{
    id: string;
    visitedAt: Date;
    duration?: number;
    pageViews?: number;
    timeSpent?: number;
  }>;
  leadScores: Array<{
    id: string;
    score: number;
    calculatedAt: Date;
  }>;
}

export interface ScoringCriteria {
  demographics: {
    ageRange?: { min: number; max: number; points: number };
    location?: { regions: string[]; points: number };
    income?: { min: number; points: number };
  };
  behavioral: {
    websiteVisits?: { threshold: number; points: number };
    pageViews?: { threshold: number; points: number };
    timeOnSite?: { minMinutes: number; points: number };
    emailEngagement?: { opens: number; clicks: number; points: number };
    smsEngagement?: { clicks: number; points: number };
    socialEngagement?: { likes: number; shares: number; points: number };
  };
  vehicleInterest: {
    priceRange?: { min: number; max: number; points: number };
    vehicleType?: { types: string[]; points: number };
    inquiryType?: { types: string[]; points: number };
    testDriveRequest?: { points: number };
  };
  engagement: {
    formSubmissions?: { count: number; points: number };
    phoneCallsMade?: { count: number; points: number };
    appointmentsScheduled?: { count: number; points: number };
    brochureDownloads?: { count: number; points: number };
  };
  temporal: {
    recentActivity?: { days: number; multiplier: number };
    seasonalInterest?: { months: number[]; multiplier: number };
    urgencyIndicators?: { keywords: string[]; points: number };
  };
}

export interface LeadScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  breakdown: {
    demographics: number;
    behavioral: number;
    vehicleInterest: number;
    engagement: number;
    temporal: number;
  };
  qualificationLevel: 'COLD' | 'WARM' | 'HOT' | 'QUALIFIED';
  recommendations: string[];
  nextActions: string[];
}

export class LeadScoringEngine {
  private scoringCriteria: ScoringCriteria;

  constructor(customCriteria?: Partial<ScoringCriteria>) {
    this.scoringCriteria = this.getDefaultScoringCriteria();

    if (customCriteria) {
      this.scoringCriteria = this.mergeCriteria(this.scoringCriteria, customCriteria);
    }
  }

  /**
   * Calculate lead score for a customer
   */
  async calculateLeadScore(customerId: string): Promise<LeadScoringResult> {
    try {
      // Get customer data with all related information
      const customer = await this.getCustomerData(customerId);

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Calculate scores for each category
      const demographicsScore = this.calculateDemographicsScore(customer);
      const behavioralScore = await this.calculateBehavioralScore(customer);
      const vehicleInterestScore = await this.calculateVehicleInterestScore(customer);
      const engagementScore = await this.calculateEngagementScore(customer);
      const temporalScore = await this.calculateTemporalScore(customer);

      // Calculate total score
      const totalScore = demographicsScore + behavioralScore + vehicleInterestScore + engagementScore + temporalScore;
      const maxPossibleScore = this.calculateMaxPossibleScore();
      const scorePercentage = (totalScore / maxPossibleScore) * 100;

      // Determine qualification level
      const qualificationLevel = this.determineQualificationLevel(scorePercentage);

      // Generate recommendations and next actions
      const recommendations = this.generateRecommendations(customer, {
        demographic: demographicsScore,
        behavioral: behavioralScore,
        vehicleInterest: vehicleInterestScore,
        engagement: engagementScore,
        temporal: temporalScore
      });

      const nextActions = this.generateNextActions(qualificationLevel, customer);

      return {
        totalScore,
        maxPossibleScore,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        breakdown: {
          demographics: demographicsScore,
          behavioral: behavioralScore,
          vehicleInterest: vehicleInterestScore,
          engagement: engagementScore,
          temporal: temporalScore
        },
        qualificationLevel,
        recommendations,
        nextActions
      };

    } catch (error) {
      console.error('Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Calculate lead score for a vehicle inquiry
   */
  async calculateInquiryScore(inquiryId: string): Promise<LeadScoringResult> {
    try {
      const inquiry = await prisma.vehicleInquiry.findUnique({
        where: { id: inquiryId },
        include: {
          vehicle: true,
          customer: true
        }
      });

      if (!inquiry) {
        throw new Error(`Inquiry ${inquiryId} not found`);
      }

      // If customer exists, use customer scoring
      if (inquiry.customerId) {
        return await this.calculateLeadScore(inquiry.customerId);
      }

      // Score inquiry-only lead
      const inquiryScore = await this.scoreInquiryOnlyLead(inquiry);

      return inquiryScore;

    } catch (error) {
      console.error('Error calculating inquiry score:', error);
      throw error;
    }
  }

  /**
   * Batch calculate scores for multiple leads
   */
  async batchCalculateScores(customerIds: string[]): Promise<Map<string, LeadScoringResult>> {
    const results = new Map<string, LeadScoringResult>();

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < customerIds.length; i += batchSize) {
      const batch = customerIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (customerId) => {
        try {
          const score = await this.calculateLeadScore(customerId);
          return { customerId, score };
        } catch (error) {
          console.error(`Failed to calculate score for customer ${customerId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(result => {
        if (result) {
          results.set(result.customerId, result.score);
        }
      });
    }

    return results;
  }

  /**
   * Get customer data for scoring
   */
  private async getCustomerData(customerId: string) {
    return await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        vehicleInquiries: {
          include: { vehicle: true },
          orderBy: { createdAt: 'desc' }
        },
        leadScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 5
        },
        emailLogs: {
          where: { sentAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } // Last 90 days
        },
        smsLogs: {
          where: { sentAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        },
        websiteActivity: {
          where: { visitedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Last 30 days
        }
      }
    });
  }

  /**
   * Calculate demographics score
   */
  private calculateDemographicsScore(customer: CustomerWithIncludes): number {
    let score = 0;
    const criteria = this.scoringCriteria.demographics;

    // Age scoring
    if (criteria.ageRange && customer.birthDate) {
      const age = new Date().getFullYear() - new Date(customer.birthDate).getFullYear();
      if (age >= criteria.ageRange.min && age <= criteria.ageRange.max) {
        score += criteria.ageRange.points;
      }
    }

    // Location scoring (Kosovo regions)
    if (criteria.location && customer.address) {
      const customerLocation = customer.address.toLowerCase();
      const matchingRegion = criteria.location.regions.find(region =>
        customerLocation.includes(region.toLowerCase())
      );
      if (matchingRegion) {
        score += criteria.location.points;
      }
    }

    return score;
  }

  /**
   * Calculate behavioral score
   */
  private async calculateBehavioralScore(customer: CustomerWithIncludes): Promise<number> {
    let score = 0;
    const criteria = this.scoringCriteria.behavioral;

    // Website engagement
    if (criteria.websiteVisits && customer.websiteActivity) {
      const visitCount = customer.websiteActivity.length;
      if (visitCount >= criteria.websiteVisits.threshold) {
        score += criteria.websiteVisits.points;
      }
    }

    // Time on site
    if (criteria.timeOnSite && customer.websiteActivity) {
      const avgTimeOnSite = customer.websiteActivity.reduce((sum: number, activity) => {
        return sum + (activity.timeSpent || 0);
      }, 0) / customer.websiteActivity.length;

      if (avgTimeOnSite >= criteria.timeOnSite.minMinutes * 60) {
        score += criteria.timeOnSite.points;
      }
    }

    // Email engagement
    if (criteria.emailEngagement && customer.emailLogs) {
      const opens = customer.emailLogs.filter((log) => log.openedAt).length;
      const clicks = customer.emailLogs.filter((log) => log.clickedAt).length;

      if (opens >= criteria.emailEngagement.opens && clicks >= criteria.emailEngagement.clicks) {
        score += criteria.emailEngagement.points;
      }
    }

    // SMS engagement
    if (criteria.smsEngagement && customer.smsLogs) {
      const clicks = customer.smsLogs.filter((log) => log.clickedAt).length;
      if (clicks >= criteria.smsEngagement.clicks) {
        score += criteria.smsEngagement.points;
      }
    }

    return score;
  }

  /**
   * Calculate vehicle interest score
   */
  private async calculateVehicleInterestScore(customer: CustomerWithIncludes): Promise<number> {
    let score = 0;
    const criteria = this.scoringCriteria.vehicleInterest;

    if (!customer.vehicleInquiries || customer.vehicleInquiries.length === 0) {
      return score;
    }

    // Price range interest
    if (criteria.priceRange) {
      const avgPriceInterest = customer.vehicleInquiries.reduce((sum: number, inquiry) => {
        return sum + (inquiry.vehicle?.price || 0);
      }, 0) / customer.vehicleInquiries.length;

      if (avgPriceInterest >= criteria.priceRange.min && avgPriceInterest <= criteria.priceRange.max) {
        score += criteria.priceRange.points;
      }
    }

    // Vehicle type interest
    if (criteria.vehicleType) {
      const vehicleTypes = customer.vehicleInquiries.map((inquiry) => inquiry.vehicle?.type).filter(Boolean);
      const hasMatchingType = vehicleTypes.some((type: string | undefined) =>
        type && criteria.vehicleType!.types.includes(type)
      );
      if (hasMatchingType) {
        score += criteria.vehicleType.points;
      }
    }

    // Inquiry type scoring
    if (criteria.inquiryType) {
      const inquiryTypes = customer.vehicleInquiries.map((inquiry) => inquiry.inquiryType);
      const hasMatchingInquiry = inquiryTypes.some((type: string) =>
        criteria.inquiryType!.types.includes(type)
      );
      if (hasMatchingInquiry) {
        score += criteria.inquiryType.points;
      }
    }

    // Test drive requests
    if (criteria.testDriveRequest) {
      const hasTestDriveRequest = customer.vehicleInquiries.some((inquiry: Record<string, unknown>) =>
        inquiry.inquiryType === 'TEST_DRIVE'
      );
      if (hasTestDriveRequest) {
        score += criteria.testDriveRequest.points;
      }
    }

    return score;
  }

  /**
   * Calculate engagement score
   */
  private async calculateEngagementScore(customer: CustomerWithIncludes & { phoneCalls?: number }): Promise<number> {
    let score = 0;
    const criteria = this.scoringCriteria.engagement;

    // Form submissions
    if (criteria.formSubmissions) {
      const submissionCount = customer.vehicleInquiries.length || 0;
      if (submissionCount >= criteria.formSubmissions.count) {
        score += criteria.formSubmissions.points;
      }
    }

    // Phone calls (would be tracked separately)
    if (criteria.phoneCallsMade && customer.phoneCalls) {
      if (customer.phoneCalls >= criteria.phoneCallsMade.count) {
        score += criteria.phoneCallsMade.points;
      }
    }

    return score;
  }

  /**
   * Calculate temporal score based on recency and timing
   */
  private async calculateTemporalScore(customer: CustomerWithIncludes): Promise<number> {
    let score = 0;
    const criteria = this.scoringCriteria.temporal;

    // Recent activity bonus
    if (criteria.recentActivity) {
      const recentActivityDate = new Date(Date.now() - criteria.recentActivity.days * 24 * 60 * 60 * 1000);

      const hasRecentActivity = customer.vehicleInquiries.some((inquiry: { createdAt?: string | Date }) =>
        inquiry.createdAt && new Date(inquiry.createdAt as string) > recentActivityDate
      ) || customer.websiteActivity.some((activity) =>
        new Date(activity.visitedAt) > recentActivityDate
      );

      if (hasRecentActivity) {
        score *= criteria.recentActivity.multiplier;
      }
    }

    // Seasonal interest (car buying seasons)
    if (criteria.seasonalInterest) {
      const currentMonth = new Date().getMonth() + 1;
      if (criteria.seasonalInterest.months.includes(currentMonth)) {
        score *= criteria.seasonalInterest.multiplier;
      }
    }

    return score;
  }

  /**
   * Score inquiry-only leads (no customer record)
   */
  private async scoreInquiryOnlyLead(inquiry: {
    inquiryType: string;
    vehicle?: { price?: number } | null;
    message?: string;
    createdAt?: Date | string;
  }): Promise<LeadScoringResult> {
    let score = 0;
    const maxScore = 100; // Simplified for inquiry-only

    // Inquiry type scoring
    const inquiryTypeScores: Record<string, number> = {
      'TEST_DRIVE': 40,
      'PURCHASE_INQUIRY': 35,
      'FINANCING_INFO': 30,
      'TRADE_IN': 25,
      'GENERAL_INQUIRY': 15
    };

    score += inquiryTypeScores[inquiry.inquiryType as string] || 10;

    // Vehicle price range scoring
    if (inquiry.vehicle?.price) {
      if (inquiry.vehicle.price > 20000) score += 20;
      else if (inquiry.vehicle.price > 10000) score += 15;
      else score += 10;
    }

    // Message quality scoring
    if (inquiry.message) {
      const messageLength = (inquiry.message as string).length;
      if (messageLength > 100) score += 15;
      else if (messageLength > 50) score += 10;
      else if (messageLength > 20) score += 5;

      // Check for urgency indicators
      const urgencyKeywords = ['urgent', 'asap', 'soon', 'today', 'tomorrow', 'interested', 'want'];
      const hasUrgency = urgencyKeywords.some(keyword =>
        (inquiry.message as string).toLowerCase().includes(keyword)
      );
      if (hasUrgency) score += 10;
    }

    const scorePercentage = (score / maxScore) * 100;
    const qualificationLevel = this.determineQualificationLevel(scorePercentage);

    return {
      totalScore: score,
      maxPossibleScore: maxScore,
      scorePercentage,
      breakdown: {
        demographics: 0,
        behavioral: 0,
        vehicleInterest: score * 0.7,
        engagement: score * 0.3,
        temporal: 0
      },
      qualificationLevel,
      recommendations: this.generateInquiryRecommendations(inquiry, score),
      nextActions: this.generateNextActions(qualificationLevel, inquiry)
    };
  }

  /**
   * Determine qualification level based on score percentage
   */
  private determineQualificationLevel(scorePercentage: number): 'COLD' | 'WARM' | 'HOT' | 'QUALIFIED' {
    if (scorePercentage >= 80) return 'QUALIFIED';
    if (scorePercentage >= 60) return 'HOT';
    if (scorePercentage >= 40) return 'WARM';
    return 'COLD';
  }

  /**
   * Generate recommendations based on scoring breakdown
   */
  private generateRecommendations(customer: CustomerWithIncludes, breakdown: ScoreBreakdown): string[] {
    const recommendations: string[] = [];

    if (breakdown.engagement < 20) {
      recommendations.push('Increase engagement through targeted email campaigns');
      recommendations.push('Send personalized vehicle recommendations');
    }

    if (breakdown.behavioral < 15) {
      recommendations.push('Encourage website exploration with special offers');
      recommendations.push('Retarget with social media ads');
    }

    if (breakdown.vehicleInterest > 30) {
      recommendations.push('High vehicle interest detected - prioritize personal contact');
      recommendations.push('Schedule test drive or showroom visit');
    }

    if (customer.vehicleInquiries && customer.vehicleInquiries.length > 2) {
      recommendations.push('Multiple inquiries indicate serious interest - expedite follow-up');
    }

    return recommendations;
  }

  /**
   * Generate inquiry-specific recommendations
   */
  private generateInquiryRecommendations(inquiry: {
    inquiryType?: string;
    vehicle?: { price?: number } | null;
  }, score: number): string[] {
    const recommendations: string[] = [];

    if (inquiry.inquiryType === 'TEST_DRIVE') {
      recommendations.push('High-priority lead - schedule test drive within 24 hours');
    }

    if (inquiry.inquiryType === 'PURCHASE_INQUIRY') {
      recommendations.push('Ready to buy - contact immediately to discuss financing');
    }

    if (score > 70) {
      recommendations.push('High-quality lead - assign to senior sales representative');
    }

    return recommendations;
  }

  /**
   * Generate next actions based on qualification level
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateNextActions(level: string, _data: Record<string, unknown>): string[] {
    const actions: string[] = [];

    switch (level) {
      case 'QUALIFIED':
        actions.push('Immediate phone call within 1 hour');
        actions.push('Schedule in-person meeting');
        actions.push('Prepare financing options');
        break;

      case 'HOT':
        actions.push('Phone call within 4 hours');
        actions.push('Send detailed vehicle information');
        actions.push('Offer test drive appointment');
        break;

      case 'WARM':
        actions.push('Follow up within 24 hours');
        actions.push('Send email with similar vehicles');
        actions.push('Add to nurturing campaign');
        break;

      case 'COLD':
        actions.push('Add to general email campaign');
        actions.push('Send monthly newsletter');
        actions.push('Retarget with social media ads');
        break;
    }

    return actions;
  }

  /**
   * Calculate maximum possible score
   */
  private calculateMaxPossibleScore(): number {
    const criteria = this.scoringCriteria;
    let maxScore = 0;

    // Demographics
    if (criteria.demographics.ageRange) maxScore += criteria.demographics.ageRange.points;
    if (criteria.demographics.location) maxScore += criteria.demographics.location.points;
    if (criteria.demographics.income) maxScore += criteria.demographics.income.points;

    // Behavioral
    if (criteria.behavioral.websiteVisits) maxScore += criteria.behavioral.websiteVisits.points;
    if (criteria.behavioral.timeOnSite) maxScore += criteria.behavioral.timeOnSite.points;
    if (criteria.behavioral.emailEngagement) maxScore += criteria.behavioral.emailEngagement.points;
    if (criteria.behavioral.smsEngagement) maxScore += criteria.behavioral.smsEngagement.points;

    // Vehicle Interest
    if (criteria.vehicleInterest.priceRange) maxScore += criteria.vehicleInterest.priceRange.points;
    if (criteria.vehicleInterest.vehicleType) maxScore += criteria.vehicleInterest.vehicleType.points;
    if (criteria.vehicleInterest.inquiryType) maxScore += criteria.vehicleInterest.inquiryType.points;
    if (criteria.vehicleInterest.testDriveRequest) maxScore += criteria.vehicleInterest.testDriveRequest.points;

    // Engagement
    if (criteria.engagement.formSubmissions) maxScore += criteria.engagement.formSubmissions.points;
    if (criteria.engagement.phoneCallsMade) maxScore += criteria.engagement.phoneCallsMade.points;
    if (criteria.engagement.appointmentsScheduled) maxScore += criteria.engagement.appointmentsScheduled.points;

    return maxScore || 100; // Default to 100 if no criteria set
  }

  /**
   * Get default scoring criteria for automotive sales
   */
  private getDefaultScoringCriteria(): ScoringCriteria {
    return {
      demographics: {
        ageRange: { min: 25, max: 65, points: 15 },
        location: { regions: ['mitrovica', 'pristina', 'peja', 'gjakova', 'ferizaj'], points: 10 }
      },
      behavioral: {
        websiteVisits: { threshold: 3, points: 20 },
        timeOnSite: { minMinutes: 5, points: 15 },
        emailEngagement: { opens: 2, clicks: 1, points: 25 },
        smsEngagement: { clicks: 1, points: 20 }
      },
      vehicleInterest: {
        priceRange: { min: 5000, max: 50000, points: 20 },
        vehicleType: { types: ['CAR', 'SUV'], points: 15 },
        inquiryType: { types: ['TEST_DRIVE', 'PURCHASE_INQUIRY'], points: 30 },
        testDriveRequest: { points: 40 }
      },
      engagement: {
        formSubmissions: { count: 1, points: 25 },
        phoneCallsMade: { count: 1, points: 35 },
        appointmentsScheduled: { count: 1, points: 45 }
      },
      temporal: {
        recentActivity: { days: 7, multiplier: 1.2 },
        seasonalInterest: { months: [3, 4, 5, 9, 10, 11], multiplier: 1.1 }
      }
    };
  }

  /**
   * Merge custom criteria with defaults
   */
  private mergeCriteria(defaultCriteria: ScoringCriteria, customCriteria: Partial<ScoringCriteria>): ScoringCriteria {
    return {
      demographics: { ...defaultCriteria.demographics, ...customCriteria.demographics },
      behavioral: { ...defaultCriteria.behavioral, ...customCriteria.behavioral },
      vehicleInterest: { ...defaultCriteria.vehicleInterest, ...customCriteria.vehicleInterest },
      engagement: { ...defaultCriteria.engagement, ...customCriteria.engagement },
      temporal: { ...defaultCriteria.temporal, ...customCriteria.temporal }
    };
  }
}

export default LeadScoringEngine;