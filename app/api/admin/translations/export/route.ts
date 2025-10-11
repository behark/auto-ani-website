import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/translations/export - Export translations in JSON or CSV format (SECURED)
export async function GET(request: NextRequest) {
  return createAdminHandler(
    async (req: NextRequest, user: AuthenticatedUser) => {
      // Apply rate limiting
      const rateLimitResult = await rateLimiters.api(req);
      if (rateLimitResult && rateLimitResult.status === 429) {
        return rateLimitResult;
      }

      try {
        const searchParams = req.nextUrl.searchParams;
        const format = searchParams.get('format') || 'json';
        const namespace = searchParams.get('namespace') || 'common';

        // Get translations for the namespace
        const translationSettings = await prisma.setting.findMany({
          where: {
            category: 'translations',
            key: {
              startsWith: `${namespace}.`,
            },
          },
        });

        logger.info('Translations exported:', {
          namespace,
          format,
          count: translationSettings.length,
          userId: user.id,
          email: user.email,
        });

        if (format === 'json') {
          // Export as JSON
          const exportData = translationSettings.reduce((acc: Record<string, any>, setting: {
            key: string;
            value: string;
          }) => {
            const key = setting.key.replace(`${namespace}.`, '');
            try {
              acc[key] = JSON.parse(setting.value);
            } catch (err) {
              logger.warn('Failed to parse translation:', { key: setting.key });
            }
            return acc;
          }, {} as Record<string, any>);

          return new NextResponse(
            JSON.stringify(exportData, null, 2),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="translations-${namespace}.json"`,
              },
            }
          );
        } else if (format === 'csv') {
          // Export as CSV
          const supportedLanguages = ['sq', 'en', 'sr', 'ar'];
          const csvRows = ['Key,' + supportedLanguages.join(',')];

          translationSettings.forEach((setting: {
            key: string;
            value: string;
          }) => {
            const key = setting.key.replace(`${namespace}.`, '');
            try {
              const translations = JSON.parse(setting.value);
              const row = [
                key,
                ...supportedLanguages.map(lang => {
                  const value = translations[lang] || '';
                  // Escape CSV values
                  return `"${value.replace(/"/g, '""')}"`;
                }),
              ];
              csvRows.push(row.join(','));
            } catch (err) {
              logger.warn('Failed to parse translation:', { key: setting.key });
            }
          });

          return new NextResponse(
            csvRows.join('\n'),
            {
              status: 200,
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="translations-${namespace}.csv"`,
              },
            }
          );
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid format. Use json or csv' },
            { status: 400 }
          );
        }
      } catch (error) {
        logger.error('Error exporting translations:', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { success: false, error: 'Failed to export translations' },
          { status: 500 }
        );
      }
    },
    {
      requireAdmin: true,
      logAction: 'Export translations',
      auditSensitive: true,
    }
  )(request);
}