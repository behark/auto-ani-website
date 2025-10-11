import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/translations - Get translations by namespace (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const searchParams = request.nextUrl.searchParams;
      const namespace = searchParams.get('namespace') || 'common';
      const language = searchParams.get('language');

      // For now, we'll use the Settings table to store translations as JSON
      // In production, you might want a dedicated Translation table
      const translationSettings = await prisma.setting.findMany({
        where: {
          category: 'translations',
          key: {
            startsWith: `${namespace}.`,
          },
        },
      });

      // Transform settings into translation format
      const translations = translationSettings.map((setting: {
        key: string;
        value: string;
        updatedAt: Date;
      }) => {
        const key = setting.key;
        const translationData = JSON.parse(setting.value);

        // Check if all languages have translations
        const supportedLanguages = ['sq', 'en', 'sr', 'ar'];
        const isComplete = supportedLanguages.every(
          lang => translationData[lang] && translationData[lang].trim() !== ''
        );

        return {
          key,
          namespace,
          translations: translationData,
          isComplete,
          lastModified: setting.updatedAt.toISOString(),
        };
      });

      // Filter by language if specified
      const filteredTranslations = language
        ? translations.filter((t: any) => t.translations[language])
        : translations;

      return NextResponse.json({
        success: true,
        translations: filteredTranslations,
      });
    } catch (error) {
      logger.error('Error fetching translations:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch translations' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch translations',
  }
);

// POST /api/admin/translations - Create or update a translation (SECURED)
export const POST = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const body = await request.json();
      const { key, namespace, translations } = body;

      if (!key || !namespace || !translations) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const fullKey = key.includes('.') ? key : `${namespace}.${key}`;

      // Upsert the translation
      const translation = await prisma.setting.upsert({
        where: { key: fullKey },
        update: {
          value: JSON.stringify(translations),
          updatedAt: new Date(),
        },
        create: {
          key: fullKey,
          value: JSON.stringify(translations),
          category: 'translations',
        },
      });

      logger.info('Translation saved:', {
        key: fullKey,
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        translation: {
          key: fullKey,
          namespace,
          translations,
          lastModified: translation.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error saving translation:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to save translation' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Save translation',
    auditSensitive: true,
  }
);

// DELETE /api/admin/translations - Delete a translation (SECURED)
export const DELETE = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      const body = await request.json();
      const { key, namespace } = body;

      if (!key || !namespace) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const fullKey = key.includes('.') ? key : `${namespace}.${key}`;

      await prisma.setting.delete({
        where: { key: fullKey },
      });

      logger.info('Translation deleted:', {
        key: fullKey,
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error deleting translation:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to delete translation' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Delete translation',
    auditSensitive: true,
  }
);