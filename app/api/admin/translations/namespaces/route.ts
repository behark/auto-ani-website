import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/translations/namespaces - Get all translation namespaces with stats (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      // Get all translation settings
      const translationSettings = await prisma.setting.findMany({
        where: {
          category: 'translations',
        },
      });

    // Group by namespace and calculate stats
    const namespaceMap = new Map<string, {
      keyCount: number;
      completeness: { [locale: string]: number };
    }>();

    const supportedLanguages = ['sq', 'en', 'sr', 'ar'];

    translationSettings.forEach((setting: {
      key: string;
      value: string;
    }) => {
      // Extract namespace from key (e.g., "common.welcome.title" -> "common")
      const namespace = setting.key.split('.')[0];

      if (!namespaceMap.has(namespace)) {
        namespaceMap.set(namespace, {
          keyCount: 0,
          completeness: supportedLanguages.reduce((acc, lang) => {
            acc[lang] = 0;
            return acc;
          }, {} as { [locale: string]: number }),
        });
      }

      const nsData = namespaceMap.get(namespace)!;
      nsData.keyCount++;

      // Check completeness for each language
      try {
        const translations = JSON.parse(setting.value);
        supportedLanguages.forEach(lang => {
          if (translations[lang] && translations[lang].trim() !== '') {
            nsData.completeness[lang]++;
          }
        });
      } catch (err) {
        logger.warn('Failed to parse translation value:', { key: setting.key });
      }
    });

    // Convert to array and calculate percentages
    const namespaces = Array.from(namespaceMap.entries()).map(([name, data]) => {
      const completeness = Object.entries(data.completeness).reduce((acc, [lang, count]) => {
        acc[lang] = data.keyCount > 0 ? Math.round((count / data.keyCount) * 100) : 0;
        return acc;
      }, {} as { [locale: string]: number });

      return {
        name,
        keyCount: data.keyCount,
        completeness,
      };
    });

    // Add default namespaces if they don't exist
    const defaultNamespaces = ['common', 'vehicles', 'ecommerce'];
    defaultNamespaces.forEach(ns => {
      if (!namespaces.find(n => n.name === ns)) {
        namespaces.push({
          name: ns,
          keyCount: 0,
          completeness: supportedLanguages.reduce((acc, lang) => {
            acc[lang] = 0;
            return acc;
          }, {} as { [locale: string]: number }),
        });
      }
    });

      return NextResponse.json({
        success: true,
        namespaces,
      });
    } catch (error) {
      logger.error('Error fetching namespaces:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch namespaces' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch translation namespaces',
  }
);