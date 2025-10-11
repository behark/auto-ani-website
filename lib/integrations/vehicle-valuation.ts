// Vehicle Valuation API Integration for AUTO ANI
// Provides market value estimates for vehicles using multiple data sources

import { prisma } from '@/lib/prisma';
import {
  ExternalAPIError,
  retryWithBackoff,
  Cache,
  getEnvVar,
} from '@/lib/api-utils';

// Cache for valuation results
const valuationCache = new Cache<VehicleValuation>();

export interface VehicleValuationParams {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  trim?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
}

export interface VehicleValuation {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  currency: string;
  confidence: number;
  source: string;
  marketAnalysis?: {
    averageMarketPrice: number;
    priceTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
    similarListings: number;
    daysOnMarket: number;
    demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  valuationFactors?: {
    baseValue: number;
    mileageAdjustment: number;
    conditionAdjustment: number;
    marketDemandAdjustment: number;
    ageDepreciation: number;
  };
}

// Vehicle Valuation Service Class
export class VehicleValuationService {
  /**
   * Get vehicle valuation from multiple sources
   */
  static async getVehicleValuation(
    params: VehicleValuationParams
  ): Promise<VehicleValuation> {
    const { make, model, year, mileage, condition = 'GOOD' } = params;

    // Check cache first
    const cacheKey = `valuation:${make}:${model}:${year}:${mileage}:${condition}`;
    const cached = valuationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check database for recent valuation
    const recentValuation = await prisma.vehicleValuation.findFirst({
      where: {
        make,
        model,
        year,
        mileage: {
          gte: mileage - 10000,
          lte: mileage + 10000,
        },
        condition,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentValuation) {
      const result: VehicleValuation = {
        estimatedValue: recentValuation.estimatedValue,
        minValue: recentValuation.minValue || recentValuation.estimatedValue * 0.9,
        maxValue: recentValuation.maxValue || recentValuation.estimatedValue * 1.1,
        currency: recentValuation.currency,
        confidence: 85,
        source: recentValuation.source,
        marketAnalysis: recentValuation.marketAnalysis
          ? JSON.parse(recentValuation.marketAnalysis)
          : undefined,
      };

      valuationCache.set(cacheKey, result, 3600); // Cache for 1 hour
      return result;
    }

    // Get valuation from multiple sources
    const valuations = await Promise.allSettled([
      VehicleValuationService.getMarketBasedValuation(params),
      VehicleValuationService.getHistoricalDataValuation(params),
      VehicleValuationService.getComparableVehiclesValuation(params),
    ]);

    // Combine results
    const validValuations = valuations
      .filter((v: any) => v.status === 'fulfilled')
      .map((v: any) => v.value);

    if (validValuations.length === 0) {
      throw new Error('Unable to get vehicle valuation from any source');
    }

    // Calculate weighted average
    const totalConfidence = validValuations.reduce(
      (sum: number, v: any) => sum + v.confidence,
      0
    );
    const weightedValue =
      validValuations.reduce(
        (sum: number, v: any) => sum + v.estimatedValue * v.confidence,
        0
      ) / totalConfidence;

    const minValue = Math.min(...validValuations.map((v: any) => v.minValue));
    const maxValue = Math.max(...validValuations.map((v: any) => v.maxValue));

    const result: VehicleValuation = {
      estimatedValue: Math.round(weightedValue),
      minValue: Math.round(minValue),
      maxValue: Math.round(maxValue),
      currency: 'EUR',
      confidence: Math.round(totalConfidence / validValuations.length),
      source: 'AGGREGATED',
      marketAnalysis: validValuations[0]?.marketAnalysis,
    };

    // Store in database
    await prisma.vehicleValuation.create({
      data: {
        make,
        model,
        year,
        mileage,
        condition,
        source: 'AGGREGATED',
        estimatedValue: result.estimatedValue,
        minValue: result.minValue,
        maxValue: result.maxValue,
        currency: 'EUR',
        marketAnalysis: result.marketAnalysis
          ? JSON.stringify(result.marketAnalysis)
          : undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Cache result
    valuationCache.set(cacheKey, result, 3600);

    return result;
  }

  /**
   * Get market-based valuation using current listings
   */
  private static async getMarketBasedValuation(
    params: VehicleValuationParams
  ): Promise<VehicleValuation> {
    const { make, model, year, mileage, condition } = params;

    // Find similar vehicles in our database
    const similarVehicles = await prisma.vehicle.findMany({
      where: {
        make: {
          equals: make,
          mode: 'insensitive',
        },
        model: {
          equals: model,
          mode: 'insensitive',
        },
        year: {
          gte: year - 2,
          lte: year + 2,
        },
        status: 'AVAILABLE',
      },
      take: 20,
    });

    if (similarVehicles.length === 0) {
      throw new Error('No comparable vehicles found');
    }

    // Calculate average price adjusted for mileage
    const prices = similarVehicles.map((v: any) => {
      const mileageDiff = Math.abs(v.mileage - mileage);
      const mileageAdjustment = (mileageDiff / 10000) * 500; // -500 EUR per 10k km difference
      return v.price - (v.mileage > mileage ? -mileageAdjustment : mileageAdjustment);
    });

    const averagePrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Adjust for condition
    const conditionMultipliers = {
      EXCELLENT: 1.1,
      GOOD: 1.0,
      FAIR: 0.9,
      POOR: 0.75,
    };

    const conditionMultiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 1;
    const estimatedValue = averagePrice * conditionMultiplier;

    return {
      estimatedValue: Math.round(estimatedValue),
      minValue: Math.round(minPrice * conditionMultiplier * 0.95),
      maxValue: Math.round(maxPrice * conditionMultiplier * 1.05),
      currency: 'EUR',
      confidence: Math.min(95, 50 + similarVehicles.length * 2),
      source: 'MARKET_BASED',
      marketAnalysis: {
        averageMarketPrice: Math.round(averagePrice),
        priceTrend: 'STABLE',
        similarListings: similarVehicles.length,
        daysOnMarket: 30,
        demandLevel: similarVehicles.length > 10 ? 'HIGH' : 'MEDIUM',
      },
    };
  }

  /**
   * Get historical data valuation
   */
  private static async getHistoricalDataValuation(
    params: VehicleValuationParams
  ): Promise<VehicleValuation> {
    const { make, model, year, mileage, condition } = params;

    // Get historical valuations
    const historicalValuations = await prisma.vehicleValuation.findMany({
      where: {
        make: {
          equals: make,
          mode: 'insensitive',
        },
        model: {
          equals: model,
          mode: 'insensitive',
        },
        year: {
          gte: year - 2,
          lte: year + 2,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (historicalValuations.length === 0) {
      throw new Error('No historical valuation data found');
    }

    // Calculate average with recency weight
    const now = Date.now();
    const weightedSum = historicalValuations.reduce((sum: number, v: any) => {
      const age = now - v.createdAt.getTime();
      const ageDays = age / (24 * 60 * 60 * 1000);
      const weight = Math.max(0.5, 1 - ageDays / 365); // Decay over a year
      return sum + v.estimatedValue * weight;
    }, 0);

    const totalWeight = historicalValuations.reduce((sum: number, v: any) => {
      const age = now - v.createdAt.getTime();
      const ageDays = age / (24 * 60 * 60 * 1000);
      return sum + Math.max(0.5, 1 - ageDays / 365);
    }, 0);

    const averageValue = weightedSum / totalWeight;

    // Adjust for depreciation based on year
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;
    const depreciationRate = 0.15; // 15% per year
    const depreciationFactor = Math.pow(1 - depreciationRate, vehicleAge);

    const adjustedValue = averageValue * depreciationFactor;

    return {
      estimatedValue: Math.round(adjustedValue),
      minValue: Math.round(adjustedValue * 0.9),
      maxValue: Math.round(adjustedValue * 1.1),
      currency: 'EUR',
      confidence: 75,
      source: 'HISTORICAL_DATA',
    };
  }

  /**
   * Get valuation from comparable vehicles
   */
  private static async getComparableVehiclesValuation(
    params: VehicleValuationParams
  ): Promise<VehicleValuation> {
    const { make, model, year, mileage, condition } = params;

    // Calculate base value using depreciation model
    const msrpEstimate = await VehicleValuationService.estimateMSRP(make, model, year);
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;

    // Depreciation curve: First year 20%, then 15% per year
    let depreciatedValue = msrpEstimate;
    for (let i = 0; i < vehicleAge; i++) {
      const depreciationRate = i === 0 ? 0.20 : 0.15;
      depreciatedValue *= 1 - depreciationRate;
    }

    // Adjust for mileage (average 15,000 km per year)
    const expectedMileage = vehicleAge * 15000;
    const mileageDiff = mileage - expectedMileage;
    const mileageAdjustment = (mileageDiff / 10000) * 500; // -500 EUR per 10k km over average

    // Adjust for condition
    const conditionAdjustments = {
      EXCELLENT: 1000,
      GOOD: 0,
      FAIR: -1500,
      POOR: -3000,
    };

    const estimatedValue =
      depreciatedValue - mileageAdjustment + (conditionAdjustments[condition as keyof typeof conditionAdjustments] || 0);

    return {
      estimatedValue: Math.round(estimatedValue),
      minValue: Math.round(estimatedValue * 0.85),
      maxValue: Math.round(estimatedValue * 1.15),
      currency: 'EUR',
      confidence: 70,
      source: 'DEPRECIATION_MODEL',
      valuationFactors: {
        baseValue: Math.round(depreciatedValue),
        mileageAdjustment: Math.round(-mileageAdjustment),
        conditionAdjustment: conditionAdjustments[condition as keyof typeof conditionAdjustments] || 0,
        marketDemandAdjustment: 0,
        ageDepreciation: Math.round(msrpEstimate - depreciatedValue),
      },
    };
  }

  /**
   * Estimate MSRP for a vehicle
   */
  private static async estimateMSRP(
    make: string,
    model: string,
    year: number
  ): Promise<number> {
    // This is a simplified estimation
    // In production, you would use a real API or database

    // Base MSRP estimates by make
    const baseMSRP: Record<string, number> = {
      'volkswagen': 25000,
      'bmw': 45000,
      'mercedes': 50000,
      'audi': 42000,
      'ford': 28000,
      'toyota': 27000,
      'honda': 26000,
      'nissan': 25000,
      'hyundai': 23000,
      'kia': 22000,
      'mazda': 26000,
      'volvo': 40000,
      'peugeot': 24000,
      'renault': 22000,
      'citroen': 23000,
      'fiat': 20000,
      'opel': 21000,
      'skoda': 22000,
      'seat': 23000,
    };

    const makeKey = make.toLowerCase();
    const baseMSRPValue = baseMSRP[makeKey] || 25000;

    // Adjust for year (newer = higher base price due to inflation)
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - year;
    const inflationAdjustment = yearDiff * 0.02; // 2% per year

    return baseMSRPValue * (1 + inflationAdjustment);
  }

  /**
   * Get price recommendation for listing
   */
  static async getPriceRecommendation(
    vehicleId: string
  ): Promise<{
    recommendedPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    reasoning: string;
  }> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const valuation = await VehicleValuationService.getVehicleValuation({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      condition: 'GOOD',
      bodyType: vehicle.bodyType,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
    });

    // Add dealer margin (10-15%)
    const dealerMargin = 0.12;
    const recommendedPrice = valuation.estimatedValue * (1 + dealerMargin);

    return {
      recommendedPrice: Math.round(recommendedPrice),
      minPrice: Math.round(valuation.minValue * (1 + dealerMargin * 0.8)),
      maxPrice: Math.round(valuation.maxValue * (1 + dealerMargin * 1.2)),
      confidence: valuation.confidence,
      reasoning: `Based on market analysis of similar ${vehicle.make} ${vehicle.model} vehicles with comparable mileage and condition. Includes ${Math.round(dealerMargin * 100)}% dealer margin.`,
    };
  }

  /**
   * Get valuation history for a vehicle
   */
  static async getValuationHistory(
    make: string,
    model: string,
    year: number
  ): Promise<any[]> {
    return prisma.vehicleValuation.findMany({
      where: {
        make: {
          equals: make,
          mode: 'insensitive',
        },
        model: {
          equals: model,
          mode: 'insensitive',
        },
        year,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }
}

export default VehicleValuationService;