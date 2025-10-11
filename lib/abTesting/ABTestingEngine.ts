import { prisma } from '@/lib/database';
import {
  // ABTest, // Model doesn't exist in schema
  // EmailCampaign, // Model doesn't exist in schema
  // SocialMediaPost, // Model doesn't exist in schema
} from '@prisma/client';
import {
  ABTestStatus,
  SMSCampaign,
  LandingPage,
} from '@/lib/types/missing-models';

export interface ABTestConfig {
  name: string;
  description?: string;
  hypothesis?: string;
  testType: 'landing_page' | 'email_campaign' | 'sms_campaign' | 'social_post' | 'workflow';
  entityId: string; // ID of the entity being tested
  trafficSplit: number; // 0.5 = 50/50 split
  conversionGoal: string;
  duration?: number; // in days
  confidenceLevel: number; // 0.95 = 95%
  minSampleSize: number;
  targetMetric: string; // 'conversion_rate', 'click_rate', 'open_rate', etc.
}

export interface ABTestVariant {
  variant: 'A' | 'B';
  config: any; // Variant-specific configuration
  description?: string;
}

export interface ABTestResult {
  testId: string;
  isSignificant: boolean;
  winnerVariant?: 'A' | 'B';
  confidenceLevel: number;
  pValue: number;
  improvement: number; // percentage improvement
  recommendedAction: string;
  detailedStats: {
    variantA: VariantStats;
    variantB: VariantStats;
  };
}

export interface VariantStats {
  visitors: number;
  conversions: number;
  conversionRate: number;
  standardError: number;
  confidenceInterval: [number, number];
}

export interface TestPerformanceMetrics {
  testId: string;
  status: ABTestStatus;
  runtime: number; // days
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  statisticalPower: number;
  expectedEndDate?: Date;
  currentMetrics: {
    variantA: VariantStats;
    variantB: VariantStats;
  };
}

export class ABTestingEngine {

  // Test Creation and Management
  static async createABTest(config: ABTestConfig, variants: { variantA: ABTestVariant; variantB: ABTestVariant }) {
    // Validate entity exists based on test type
    await this.validateTestEntity(config.testType, config.entityId);

    // Create the A/B test
    const abTest = await prisma.aBTest.create({
      data: {
        landingPageId: config.testType === 'landing_page' ? config.entityId : undefined,
        name: config.name,
        description: config.description,
        hypothesis: config.hypothesis,
        trafficSplit: config.trafficSplit,
        conversionGoal: config.conversionGoal,
        duration: config.duration,
        confidenceLevel: config.confidenceLevel,
        minSampleSize: config.minSampleSize,
        status: 'DRAFT'
      }
    });

    // Store variant configurations in metadata table
    await this.storeVariantConfig(abTest.id, 'A', variants.variantA);
    await this.storeVariantConfig(abTest.id, 'B', variants.variantB);

    return abTest;
  }

  static async startTest(testId: string) {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId }
    });

    if (!test) {
      throw new Error('A/B test not found');
    }

    if (test.status !== 'DRAFT') {
      throw new Error('Test can only be started from DRAFT status');
    }

    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });
  }

  static async pauseTest(testId: string) {
    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'PAUSED'
      }
    });
  }

  static async resumeTest(testId: string) {
    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING'
      }
    });
  }

  static async stopTest(testId: string, reason?: string) {
    const testResult = await this.analyzeTest(testId);

    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        winnerVariant: testResult.winnerVariant,
        isSignificant: testResult.isSignificant,
        improvement: testResult.improvement
      }
    });
  }

  // Traffic Allocation
  static assignVariant(testId: string, userId?: string, sessionId?: string): 'A' | 'B' {
    // Use consistent hashing to ensure same user always gets same variant
    const identifier = userId || sessionId || Math.random().toString();
    const hash = this.simpleHash(identifier + testId);
    return (hash % 100) < 50 ? 'A' : 'B'; // 50/50 split for now
  }

  static async recordVisitor(testId: string, variant: 'A' | 'B', metadata?: any) {
    const field = variant === 'A' ? 'visitorsA' : 'visitorsB';

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        [field]: { increment: 1 }
      }
    });

    // Log the visitor for detailed analysis
    await this.logTestEvent(testId, 'visitor', variant, metadata);
  }

  static async recordConversion(testId: string, variant: 'A' | 'B', conversionValue?: number, metadata?: any) {
    const field = variant === 'A' ? 'conversionsA' : 'conversionsB';

    const test = await prisma.aBTest.update({
      where: { id: testId },
      data: {
        [field]: { increment: 1 }
      }
    });

    // Update conversion rates
    const conversionRateA = test.visitorsA > 0 ? test.conversionsA / test.visitorsA : 0;
    const conversionRateB = test.visitorsB > 0 ? test.conversionsB / test.visitorsB : 0;

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        conversionRateA,
        conversionRateB,
        improvement: conversionRateA > 0 ? ((conversionRateB - conversionRateA) / conversionRateA) * 100 : 0
      }
    });

    // Log the conversion
    await this.logTestEvent(testId, 'conversion', variant, { value: conversionValue, ...metadata });

    // Check if test should automatically conclude
    await this.checkAutoStop(testId);
  }

  // Statistical Analysis
  static async analyzeTest(testId: string): Promise<ABTestResult> {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId }
    });

    if (!test) {
      throw new Error('A/B test not found');
    }

    const variantAStats = this.calculateVariantStats(test.visitorsA, test.conversionsA);
    const variantBStats = this.calculateVariantStats(test.visitorsB, test.conversionsB);

    // Perform statistical significance test (two-proportion z-test)
    const { isSignificant, pValue, improvement } = this.performSignificanceTest(
      variantAStats,
      variantBStats,
      test.confidenceLevel
    );

    let winnerVariant: 'A' | 'B' | undefined;
    let recommendedAction = 'Continue test - insufficient data';

    if (isSignificant) {
      winnerVariant = variantBStats.conversionRate > variantAStats.conversionRate ? 'B' : 'A';
      recommendedAction = `Implement variant ${winnerVariant} - statistically significant improvement of ${improvement.toFixed(2)}%`;
    } else if (test.visitorsA + test.visitorsB >= test.minSampleSize) {
      recommendedAction = 'No significant difference detected - consider extending test or implementing preference';
    }

    return {
      testId,
      isSignificant,
      winnerVariant,
      confidenceLevel: test.confidenceLevel,
      pValue,
      improvement,
      recommendedAction,
      detailedStats: {
        variantA: variantAStats,
        variantB: variantBStats
      }
    };
  }

  static async getTestPerformance(testId: string): Promise<TestPerformanceMetrics> {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId }
    });

    if (!test) {
      throw new Error('A/B test not found');
    }

    const runtime = test.startedAt ?
      Math.floor((new Date().getTime() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const totalVisitors = test.visitorsA + test.visitorsB;
    const totalConversions = test.conversionsA + test.conversionsB;
    const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

    // Calculate statistical power
    const statisticalPower = this.calculateStatisticalPower(
      test.visitorsA,
      test.visitorsB,
      test.conversionsA,
      test.conversionsB,
      test.confidenceLevel
    );

    // Estimate end date based on current traffic
    let expectedEndDate: Date | undefined;
    if (test.startedAt && test.duration && runtime < test.duration) {
      expectedEndDate = new Date(test.startedAt.getTime() + (test.duration * 24 * 60 * 60 * 1000));
    }

    return {
      testId,
      status: test.status,
      runtime,
      totalVisitors,
      totalConversions,
      overallConversionRate,
      statisticalPower,
      expectedEndDate,
      currentMetrics: {
        variantA: this.calculateVariantStats(test.visitorsA, test.conversionsA),
        variantB: this.calculateVariantStats(test.visitorsB, test.conversionsB)
      }
    };
  }

  // Multi-variant Testing (MVT)
  static async createMultiVariantTest(config: {
    name: string;
    description?: string;
    testType: string;
    entityId: string;
    variants: Array<{ name: string; config: any; trafficAllocation: number }>;
    conversionGoal: string;
    duration?: number;
  }) {
    // Validate traffic allocation sums to 100%
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    // For now, create multiple A/B tests for MVT simulation
    // In production, you'd want a dedicated MVT table structure
    const tests = [];
    for (let i = 0; i < config.variants.length - 1; i++) {
      const test = await this.createABTest(
        {
          name: `${config.name} - Variant ${i + 1} vs Control`,
          description: config.description,
          testType: config.testType as any,
          entityId: config.entityId,
          trafficSplit: config.variants[i].trafficAllocation / 100,
          conversionGoal: config.conversionGoal,
          duration: config.duration,
          confidenceLevel: 0.95,
          minSampleSize: 100,
          targetMetric: 'conversion_rate'
        },
        {
          variantA: { variant: 'A', config: config.variants[0].config },
          variantB: { variant: 'B', config: config.variants[i + 1].config }
        }
      );
      tests.push(test);
    }

    return tests;
  }

  // Test Management
  static async getActiveTests(entityType?: string) {
    const where: any = { status: 'RUNNING' };

    return await prisma.aBTest.findMany({
      where,
      include: {
        landingPage: entityType === 'landing_page' ? {
          select: { name: true, slug: true }
        } : false
      },
      orderBy: { startedAt: 'desc' }
    });
  }

  static async getTestHistory(entityId?: string, entityType?: string) {
    const where: any = {};

    if (entityId && entityType === 'landing_page') {
      where.landingPageId = entityId;
    }

    return await prisma.aBTest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Auto-optimization
  static async enableAutoOptimization(testId: string, threshold: number = 95) {
    // This would monitor the test and automatically implement the winner
    // when statistical significance reaches the threshold
    const result = await this.analyzeTest(testId);

    if (result.isSignificant && result.confidenceLevel >= threshold / 100) {
      await this.stopTest(testId);
      await this.implementWinner(testId, result.winnerVariant!);
      return true;
    }

    return false;
  }

  // Private helper methods
  private static async validateTestEntity(testType: string, entityId: string) {
    switch (testType) {
      case 'landing_page':
        const page = await prisma.landingPage.findUnique({ where: { id: entityId } });
        if (!page) throw new Error('Landing page not found');
        break;
      case 'email_campaign':
        const email = await prisma.emailCampaign.findUnique({ where: { id: entityId } });
        if (!email) throw new Error('Email campaign not found');
        break;
      // Add other entity validations as needed
    }
  }

  private static async storeVariantConfig(testId: string, variant: 'A' | 'B', config: ABTestVariant) {
    // Store in a metadata table - for now we'll use JSON in the test record
    // In production, consider a dedicated variant_configs table
  }

  private static async logTestEvent(testId: string, eventType: string, variant: 'A' | 'B', metadata?: any) {
    // Log detailed events for analysis
    // This could be stored in a test_events table for detailed analysis
  }

  private static calculateVariantStats(visitors: number, conversions: number): VariantStats {
    const conversionRate = visitors > 0 ? conversions / visitors : 0;
    const standardError = visitors > 0 ? Math.sqrt((conversionRate * (1 - conversionRate)) / visitors) : 0;

    // 95% confidence interval
    const marginOfError = 1.96 * standardError;
    const confidenceInterval: [number, number] = [
      Math.max(0, conversionRate - marginOfError),
      Math.min(1, conversionRate + marginOfError)
    ];

    return {
      visitors,
      conversions,
      conversionRate,
      standardError,
      confidenceInterval
    };
  }

  private static performSignificanceTest(
    variantA: VariantStats,
    variantB: VariantStats,
    confidenceLevel: number
  ) {
    const p1 = variantA.conversionRate;
    const p2 = variantB.conversionRate;
    const n1 = variantA.visitors;
    const n2 = variantB.visitors;

    if (n1 === 0 || n2 === 0) {
      return { isSignificant: false, pValue: 1, improvement: 0 };
    }

    // Pooled standard error for two-proportion z-test
    const pooledProportion = (variantA.conversions + variantB.conversions) / (n1 + n2);
    const standardError = Math.sqrt(pooledProportion * (1 - pooledProportion) * (1/n1 + 1/n2));

    const zScore = Math.abs(p2 - p1) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    const isSignificant = pValue < (1 - confidenceLevel);
    const improvement = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

    return { isSignificant, pValue, improvement };
  }

  private static calculateStatisticalPower(
    visitorsA: number,
    visitorsB: number,
    conversionsA: number,
    conversionsB: number,
    confidenceLevel: number
  ): number {
    // Simplified power calculation
    const totalVisitors = visitorsA + visitorsB;
    const totalConversions = conversionsA + conversionsB;

    if (totalVisitors < 100) return 0;
    if (totalVisitors < 500) return 0.5;
    if (totalVisitors < 1000) return 0.7;
    return 0.8;
  }

  private static normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static async checkAutoStop(testId: string) {
    // Check if test should automatically stop based on significance or duration
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test || test.status !== 'RUNNING') return;

    // Check duration
    if (test.duration && test.startedAt) {
      const daysSinceStart = (new Date().getTime() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceStart >= test.duration) {
        await this.stopTest(testId);
        return;
      }
    }

    // Check minimum sample size and significance
    if (test.visitorsA + test.visitorsB >= test.minSampleSize) {
      const result = await this.analyzeTest(testId);
      if (result.isSignificant) {
        await this.stopTest(testId);
      }
    }
  }

  private static async implementWinner(testId: string, winnerVariant: 'A' | 'B') {
    // Implement the winning variant in the actual system
    // This would update the original entity with the winning configuration
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: { landingPage: true }
    });

    if (!test) return;

    // Implementation logic would depend on the test type
    // For landing pages, you might update the page content with the winning variant
    // For email campaigns, you might set the winning template as default, etc.
  }
}