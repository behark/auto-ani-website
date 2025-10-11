import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { createAdminHandler, AuthenticatedUser } from '@/lib/auth';
import { rateLimiters } from '@/lib/rateLimiter';

// GET /api/admin/pricing/suggestions - Get pricing suggestions for vehicles (SECURED)
export const GET = createAdminHandler(
  async (request: NextRequest, user: AuthenticatedUser) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }

    try {
      // Fetch available vehicles with their details
      const vehicles = await prisma.vehicle.findMany({
        where: {
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          price: true,
          mileage: true,
          createdAt: true,
        },
        take: 20, // Limit to 20 vehicles for performance
      });

      // Calculate market averages for comparison
      const marketAverages = await calculateMarketAverages();

      // Generate pricing suggestions
      const suggestions = vehicles.map((vehicle: {
        id: string;
        make: string;
        model: string;
        year: number;
        price: number;
        mileage: number;
        createdAt: Date;
      }) => {
        const vehicleKey = `${vehicle.make}_${vehicle.model}_${Math.floor(vehicle.year / 2) * 2}`; // Group by 2-year ranges
        const marketAvg = marketAverages.get(vehicleKey) || vehicle.price;

        // Calculate suggested price based on various factors
        let suggestedPrice = marketAvg;
        let reasoning = '';
        let confidence = 70;

        // Factor 1: Market comparison
        const priceDiff = ((vehicle.price - marketAvg) / marketAvg) * 100;

        if (Math.abs(priceDiff) > 15) {
          if (priceDiff > 0) {
            suggestedPrice = marketAvg * 1.05; // 5% above market for premium positioning
            reasoning = `Current price is ${Math.abs(priceDiff).toFixed(1)}% above market average. Adjusting to maintain premium positioning while improving competitiveness.`;
          } else {
            suggestedPrice = marketAvg * 0.98; // 2% below market for competitive advantage
            reasoning = `Current price is ${Math.abs(priceDiff).toFixed(1)}% below market average. Slight increase recommended to maximize profit while staying competitive.`;
          }
          confidence = 85;
        }

        // Factor 2: Age on market
        const daysOnMarket = Math.floor(
          (Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOnMarket > 60) {
          suggestedPrice *= 0.95; // 5% reduction for vehicles on market > 60 days
          reasoning += ` Vehicle has been on market for ${daysOnMarket} days. Price reduction recommended to increase buyer interest.`;
          confidence = Math.min(confidence + 10, 95);
        }

        // Factor 3: High mileage adjustment
        if (vehicle.mileage > 100000) {
          suggestedPrice *= 0.92; // 8% reduction for high mileage
          reasoning += ' High mileage adjustment applied.';
        }

        // Determine market position
        let marketPosition: 'ABOVE' | 'BELOW' | 'COMPETITIVE' = 'COMPETITIVE';
        if (vehicle.price > marketAvg * 1.1) marketPosition = 'ABOVE';
        else if (vehicle.price < marketAvg * 0.9) marketPosition = 'BELOW';

        // Round to nearest 500
        suggestedPrice = Math.round(suggestedPrice / 500) * 500;

        // Only suggest if there's a meaningful difference
        if (Math.abs(suggestedPrice - vehicle.price) < 500) {
          return null;
        }

        return {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
          currentPrice: vehicle.price,
          suggestedPrice,
          reasoning: reasoning.trim() || 'Price optimization based on market analysis.',
          confidence,
          marketPosition,
        };
      }).filter(Boolean); // Remove null suggestions

      // Sort by potential impact (largest price differences first)
      suggestions.sort((a: any, b: any) => {
        if (!a || !b) return 0;
        const diffA = Math.abs(a.suggestedPrice - a.currentPrice);
        const diffB = Math.abs(b.suggestedPrice - b.currentPrice);
        return diffB - diffA;
      });

      return NextResponse.json({
        success: true,
        suggestions: suggestions.slice(0, 10), // Return top 10 suggestions
      });
    } catch (error) {
      logger.error('Error generating pricing suggestions:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: 'Failed to generate pricing suggestions' },
        { status: 500 }
      );
    }
  },
  {
    requireAdmin: true,
    logAction: 'Generate pricing suggestions',
  }
);

// Helper function to calculate market averages
async function calculateMarketAverages() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ['AVAILABLE', 'SOLD'] },
    },
    select: {
      make: true,
      model: true,
      year: true,
      price: true,
    },
  });

  const averages = new Map<string, number>();

  // Group vehicles and calculate averages
  const groups = new Map<string, number[]>();

  vehicles.forEach((vehicle: {
    make: string;
    model: string;
    year: number;
    price: number;
  }) => {
    const key = `${vehicle.make}_${vehicle.model}_${Math.floor(vehicle.year / 2) * 2}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(vehicle.price);
  });

  groups.forEach((prices, key) => {
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    averages.set(key, avg);
  });

  return averages;
}
