import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/pricing/market-data - Get market data for vehicles (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      // Fetch real vehicle data from database and calculate market insights
      const vehicles = await prisma.vehicle.findMany({
        select: {
          make: true,
          model: true,
          year: true,
          price: true,
          status: true,
        },
      });

      // Group vehicles by make, model, year
      const marketDataMap = new Map<string, {
        make: string;
        model: string;
        year: number;
        prices: number[];
        statuses: string[];
      }>();

      vehicles.forEach((vehicle: any) => {
        const key = `${vehicle.make}_${vehicle.model}_${vehicle.year}`;

        if (!marketDataMap.has(key)) {
          marketDataMap.set(key, {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            prices: [],
            statuses: [],
          });
        }

        const data = marketDataMap.get(key)!;
        data.prices.push(vehicle.price);
        data.statuses.push(vehicle.status);
      });

      // Calculate market statistics
      const marketData = Array.from(marketDataMap.values()).map(data => {
        const prices = data.prices.sort((a, b) => a - b);
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const minPrice = prices[0] || 0;
        const maxPrice = prices[prices.length - 1] || 0;

        // Determine market trend based on recent sales
        const soldCount = data.statuses.filter(s => s === 'SOLD').length;
        const availableCount = data.statuses.filter(s => s === 'AVAILABLE').length;
        const saleRate = soldCount / (soldCount + availableCount);

        let marketTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (saleRate > 0.6) marketTrend = 'UP';
        else if (saleRate < 0.3) marketTrend = 'DOWN';

        return {
          make: data.make,
          model: data.model,
          year: data.year,
          averagePrice: Math.round(avgPrice),
          priceRange: {
            min: minPrice,
            max: maxPrice,
          },
          marketTrend,
          competitorCount: data.prices.length,
        };
      });

      // Sort by make and model
      marketData.sort((a, b) => {
        if (a.make !== b.make) return a.make.localeCompare(b.make);
        if (a.model !== b.model) return a.model.localeCompare(b.model);
        return b.year - a.year;
      });

      return NextResponse.json({
        success: true,
        data: marketData.slice(0, 10), // Return top 10 entries
      });
    } catch (error) {
      logger.error('Error fetching market data:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Fetch market data',
  }
);
