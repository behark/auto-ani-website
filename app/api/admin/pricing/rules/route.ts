import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/pricing/rules - Get all pricing rules (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      // Fetch pricing rules from settings
      const ruleSettings = await prisma.setting.findMany({
        where: {
          category: 'pricing_rules',
          key: {
            startsWith: 'pricing_rule.',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const rules = ruleSettings
        .map((setting: any) => {
          try {
            return JSON.parse(setting.value);
          } catch (err) {
            logger.warn('Failed to parse pricing rule:', { key: setting.key });
            return null;
          }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.priority - b.priority); // Sort by priority

      return NextResponse.json({
        success: true,
        rules,
      });
    } catch (error) {
      logger.error('Error fetching pricing rules:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pricing rules' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch pricing rules',
  }
);

// POST /api/admin/pricing/rules - Create a new pricing rule (SECURED)
export const POST = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const body = await request.json();
      const { name, condition, adjustment, adjustmentType, priority = 100 } = body;

      if (!name || !condition || adjustment === undefined || !adjustmentType) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const rule = {
        id: ruleId,
        name,
        condition,
        adjustment,
        adjustmentType,
        priority,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await prisma.setting.create({
        data: {
          key: `pricing_rule.${ruleId}`,
          value: JSON.stringify(rule),
          category: 'pricing_rules',
        },
      });

      logger.info('Pricing rule created:', {
        ruleId,
        name,
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        rule,
      });
    } catch (error) {
      logger.error('Error creating pricing rule:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to create pricing rule' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Create pricing rule',
    auditSensitive: true,
  }
);

// PUT /api/admin/pricing/rules/:id - Update a pricing rule (SECURED)
export const PUT = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const url = new URL(request.url);
      const ruleId = url.pathname.split('/').pop();
      const body = await request.json();

      const setting = await prisma.setting.findUnique({
        where: {
          key: `pricing_rule.${ruleId}`,
        },
      });

      if (!setting) {
        return NextResponse.json(
          { success: false, error: 'Rule not found' },
          { status: 404 }
        );
      }

      const existingRule = JSON.parse(setting.value);
      const updatedRule = {
        ...existingRule,
        ...body,
        id: ruleId,
        updatedAt: new Date().toISOString(),
      };

      await prisma.setting.update({
        where: {
          key: `pricing_rule.${ruleId}`,
        },
        data: {
          value: JSON.stringify(updatedRule),
        },
      });

      logger.info('Pricing rule updated:', {
        ruleId,
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        rule: updatedRule,
      });
    } catch (error) {
      logger.error('Error updating pricing rule:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to update pricing rule' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Update pricing rule',
    auditSensitive: true,
  }
);
