/**
 * A/B Testing Engine for AUTO ANI
 * Test and optimize landing pages, forms, CTAs, and email campaigns
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ABTestConfig {
  name: string;
  description?: string;
  testType: 'LANDING_PAGE' | 'FORM' | 'EMAIL' | 'CTA' | 'HEADLINE';
  primaryGoal: 'CONVERSION' | 'CLICK' | 'SIGNUP' | 'INQUIRY';
  conversionGoal?: string;
  minSampleSize?: number;
  confidenceLevel?: number;
  variants: ABTestVariantConfig[];
  trafficSplit?: Record<string, number>;
}

export interface ABTestVariantConfig {
  variantId: string;
  name: string;
  description?: string;
  content: Record<string, any>;
}

export class ABTestingEngine {
  /**
   * Create new A/B test
   */
  static async createTest(config: ABTestConfig) {
    try {
      // Validate variants
      if (config.variants.length < 2) {
        throw new Error('A/B test must have at least 2 variants');
      }

      // Default traffic split (equal distribution)
      const trafficSplit = config.trafficSplit || ABTestingEngine.generateEqualSplit(config.variants.length);

      // Create test
      const test = await prisma.aBTest.create({
        data: {
          name: config.name,
          description: config.description,
          testType: config.testType,
          status: 'DRAFT',
          controlVariant: config.variants[0].variantId,
          variants: JSON.stringify(config.variants.map(v => v.variantId)),
          trafficSplit: JSON.stringify(trafficSplit),
          primaryGoal: config.primaryGoal,
          conversionGoal: config.conversionGoal,
          minSampleSize: config.minSampleSize || 100,
          confidenceLevel: config.confidenceLevel || 95,
        },
      });

      // Create variant records
      await Promise.all(
        config.variants.map((variant: ABTestVariantConfig) =>
          prisma.aBTestVariant.create({
            data: {
              testId: test.id,
              variantId: variant.variantId,
              name: variant.name,
              description: variant.description,
              content: JSON.stringify(variant.content),
            },
          })
        )
      );

      logger.info('A/B test created', { testId: test.id, name: test.name });
      return test;
    } catch (error) {
      logger.error('Failed to create A/B test', { config }, error as Error);
      throw error;
    }
  }

  /**
   * Start A/B test
   */
  static async startTest(testId: string) {
    try {
      const test = await prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      logger.info('A/B test started', { testId });
      return test;
    } catch (error) {
      logger.error('Failed to start A/B test', { testId }, error as Error);
      throw error;
    }
  }

  /**
   * Get variant for visitor (deterministic assignment)
   */
  static async getVariantForVisitor(testId: string, visitorId: string) {
    try {
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true },
      });

      if (!test || test.status !== 'RUNNING') {
        return null;
      }

      // Use deterministic assignment based on visitor ID
      const trafficSplit = JSON.parse(test.trafficSplit) as Record<string, number>;
      const variant = ABTestingEngine.assignVariant(visitorId, trafficSplit);

      const selectedVariant = test.variants.find((v: any) => v.variantId === variant);

      if (selectedVariant) {
        // Track impression
        await ABTestingEngine.trackImpression(selectedVariant.id);
      }

      return selectedVariant ? {
        variantId: selectedVariant.variantId,
        content: JSON.parse(selectedVariant.content),
      } : null;
    } catch (error) {
      logger.error('Failed to get variant for visitor', { testId, visitorId }, error as Error);
      throw error;
    }
  }

  /**
   * Track impression for variant
   */
  static async trackImpression(variantId: string) {
    try {
      await prisma.aBTestVariant.update({
        where: { id: variantId },
        data: {
          impressions: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Failed to track impression', { variantId }, error as Error);
    }
  }

  /**
   * Track conversion for variant
   */
  static async trackConversion(testId: string, variantId: string) {
    try {
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true },
      });

      if (!test || test.status !== 'RUNNING') {
        return;
      }

      const variant = test.variants.find((v: any) => v.variantId === variantId);
      if (!variant) {
        logger.warn('Variant not found for conversion tracking', { testId, variantId });
        return;
      }

      // Update variant
      const updatedVariant = await prisma.aBTestVariant.update({
        where: { id: variant.id },
        data: {
          conversions: { increment: 1 },
          conversionRate: {
            set: variant.impressions > 0
              ? ((variant.conversions + 1) / variant.impressions) * 100
              : 0,
          },
        },
      });

      logger.info('Conversion tracked', { testId, variantId, conversionRate: updatedVariant.conversionRate });

      // Check if test should conclude
      await ABTestingEngine.checkTestConclusion(testId);
    } catch (error) {
      logger.error('Failed to track conversion', { testId, variantId }, error as Error);
    }
  }

  /**
   * Get test results
   */
  static async getTestResults(testId: string) {
    try {
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true },
      });

      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      // Calculate statistics
      const variants = test.variants.map((v: any) => ({
        variantId: v.variantId,
        name: v.name,
        impressions: v.impressions,
        conversions: v.conversions,
        conversionRate: v.conversionRate,
      }));

      // Sort by conversion rate
      variants.sort((a: any, b: any) => b.conversionRate - a.conversionRate);

      // Calculate statistical significance
      const winner = variants[0];
      const control = variants.find((v: any) => v.variantId === test.controlVariant) || variants[0];

      const significance = ABTestingEngine.calculateSignificance(winner, control, test.confidenceLevel);

      return {
        test: {
          id: test.id,
          name: test.name,
          status: test.status,
          startedAt: test.startedAt,
          endedAt: test.endedAt,
        },
        variants,
        winner: test.winner,
        significance,
        isSignificant: significance >= test.confidenceLevel,
        sampleSize: variants.reduce((sum: number, v: any) => sum + v.impressions, 0),
        minSampleSize: test.minSampleSize,
      };
    } catch (error) {
      logger.error('Failed to get test results', { testId }, error as Error);
      throw error;
    }
  }

  /**
   * Check if test should conclude
   */
  private static async checkTestConclusion(testId: string) {
    try {
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true },
      });

      if (!test || test.status !== 'RUNNING') {
        return;
      }

      // Check minimum sample size
      const totalImpressions = test.variants.reduce((sum: number, v: any) => sum + v.impressions, 0);
      if (totalImpressions < test.minSampleSize) {
        return;
      }

      // Find winner
      const sortedVariants = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);
      const winner = sortedVariants[0];
      const control = test.variants.find((v: any) => v.variantId === test.controlVariant) || sortedVariants[0];

      // Calculate confidence
      const confidence = ABTestingEngine.calculateSignificance(winner, control, test.confidenceLevel);

      // Conclude if confidence threshold is met
      if (confidence >= test.confidenceLevel) {
        await prisma.aBTest.update({
          where: { id: testId },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
            winner: winner.variantId,
            winnerConfidence: confidence,
            conclusionNotes: `Winner determined with ${confidence.toFixed(2)}% confidence`,
          },
        });

        logger.info('A/B test concluded', {
          testId,
          winner: winner.variantId,
          confidence,
        });
      }
    } catch (error) {
      logger.error('Failed to check test conclusion', { testId }, error as Error);
    }
  }

  /**
   * Calculate statistical significance (simplified z-test)
   */
  private static calculateSignificance(
    variant1: any,
    variant2: any,
    targetConfidence: number
  ): number {
    if (variant1.impressions === 0 || variant2.impressions === 0) {
      return 0;
    }

    const p1 = variant1.conversions / variant1.impressions;
    const p2 = variant2.conversions / variant2.impressions;

    const pooledProbability = (variant1.conversions + variant2.conversions) /
                              (variant1.impressions + variant2.impressions);

    const standardError = Math.sqrt(
      pooledProbability * (1 - pooledProbability) *
      (1 / variant1.impressions + 1 / variant2.impressions)
    );

    if (standardError === 0) {
      return 0;
    }

    const zScore = Math.abs((p1 - p2) / standardError);

    // Convert z-score to confidence level (approximate)
    // z=1.96 ≈ 95%, z=2.58 ≈ 99%
    const confidence = 100 * (1 - 2 * (1 - ABTestingEngine.normalCDF(zScore)));

    return Math.min(confidence, 99.9);
  }

  /**
   * Normal cumulative distribution function (approximation)
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - probability : probability;
  }

  /**
   * Generate equal traffic split
   */
  private static generateEqualSplit(variantCount: number): Record<string, number> {
    const split: Record<string, number> = {};
    const percentage = 100 / variantCount;

    for (let i = 0; i < variantCount; i++) {
      split[String.fromCharCode(65 + i)] = percentage; // A, B, C, etc.
    }

    return split;
  }

  /**
   * Assign variant based on visitor ID (deterministic)
   */
  private static assignVariant(visitorId: string, trafficSplit: Record<string, number>): string {
    // Convert visitor ID to a number between 0 and 100
    let hash = 0;
    for (let i = 0; i < visitorId.length; i++) {
      hash = ((hash << 5) - hash) + visitorId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const percentage = Math.abs(hash % 100);

    // Assign variant based on traffic split
    let cumulative = 0;
    for (const [variant, split] of Object.entries(trafficSplit)) {
      cumulative += split;
      if (percentage < cumulative) {
        return variant;
      }
    }

    return Object.keys(trafficSplit)[0]; // Fallback to first variant
  }

  /**
   * Pause test
   */
  static async pauseTest(testId: string) {
    try {
      await prisma.aBTest.update({
        where: { id: testId },
        data: { status: 'PAUSED' },
      });

      logger.info('A/B test paused', { testId });
    } catch (error) {
      logger.error('Failed to pause A/B test', { testId }, error as Error);
      throw error;
    }
  }

  /**
   * Resume test
   */
  static async resumeTest(testId: string) {
    try {
      await prisma.aBTest.update({
        where: { id: testId },
        data: { status: 'RUNNING' },
      });

      logger.info('A/B test resumed', { testId });
    } catch (error) {
      logger.error('Failed to resume A/B test', { testId }, error as Error);
      throw error;
    }
  }

  /**
   * Get active tests
   */
  static async getActiveTests() {
    try {
      const tests = await prisma.aBTest.findMany({
        where: {
          status: 'RUNNING',
        },
        include: {
          variants: true,
        },
      });

      return tests;
    } catch (error) {
      logger.error('Failed to get active tests', {}, error as Error);
      throw error;
    }
  }
}