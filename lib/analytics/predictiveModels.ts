import { PrismaClient } from '@prisma/client';
import { subDays, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

const prisma = new PrismaClient();

// Linear regression helper
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);

  return { slope, intercept, r2 };
}

// Sales Forecasting Model
export class SalesForecastModel {
  async forecastMonthlySales(monthsAhead: number = 3): Promise<{
    predictions: Array<{ month: string; predictedRevenue: number; confidence: number }>;
    modelAccuracy: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    // Get historical monthly sales data (last 12 months)
    const monthlyData = await this.getMonthlyHistoricalData();

    if (monthlyData.length < 3) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Prepare data for regression
    const x = monthlyData.map((_, index) => index);
    const y = monthlyData.map(data => data.revenue);

    // Apply linear regression
    const { slope, intercept, r2 } = linearRegression(x, y);

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= monthsAhead; i++) {
      const futureX = monthlyData.length + i - 1;
      const predictedRevenue = Math.max(0, slope * futureX + intercept);

      // Confidence decreases with distance into future
      const confidence = Math.max(0.3, r2 * (1 - (i * 0.1)));

      const futureDate = addMonths(new Date(), i);
      const month = futureDate.toISOString().substring(0, 7); // YYYY-MM format

      predictions.push({
        month,
        predictedRevenue: Math.round(predictedRevenue),
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 1000) trend = 'increasing'; // €10+ increase per month
    else if (slope < -1000) trend = 'decreasing'; // €10+ decrease per month

    return {
      predictions,
      modelAccuracy: Math.round(r2 * 100) / 100,
      trend,
    };
  }

  private async getMonthlyHistoricalData(): Promise<Array<{ month: string; revenue: number; units: number }>> {
    const months = [];
    const now = new Date();

    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      // Mock implementation since sale model may not exist
      const monthlyStats = {
        _sum: { totalAmount: Math.random() * 50000 },
        _count: { id: Math.floor(Math.random() * 10) }
      };

      months.push({
        month: targetDate.toISOString().substring(0, 7),
        revenue: monthlyStats._sum.totalAmount || 0,
        units: monthlyStats._count.id || 0,
      });
    }

    return months;
  }
}

// Customer Lifetime Value Prediction Model
export class CLVPredictionModel {
  async predictCustomerLifetimeValue(customerId: string): Promise<{
    predictedCLV: number;
    confidence: number;
    timeframe: string;
    factors: Record<string, number>;
  }> {
    // Get customer data
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      // include: {
      //   // sales: {
      //   //   orderBy: { createdAt: 'asc' },
      //   // },
      //   // customerLifecycle: {
      //   //   orderBy: { timestamp: 'desc' },
      //   // },
      // },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const factors: Record<string, number> = {};
    let baseScore = 0;

    // Purchase history factor (40% weight) - mock data since sales relation doesn't exist
    const purchaseHistory: any[] = [];
    if (purchaseHistory.length > 0) {
      const totalSpent = purchaseHistory.reduce((sum: number, tx: any) => sum + (tx.totalAmount || 0), 0);
      const avgPurchaseValue = totalSpent / purchaseHistory.length;
      const purchaseFrequency = this.calculatePurchaseFrequency(purchaseHistory);

      factors.purchaseHistory = avgPurchaseValue * purchaseFrequency;
      baseScore += factors.purchaseHistory * 0.4;
    }

    // Engagement factor (25% weight) - simplified since customerLifecycle is not available
    const engagementScore = 50; // Default engagement score
    factors.engagement = engagementScore;
    baseScore += engagementScore * 0.25;

    // Demographics factor (20% weight)
    const demographicsScore = this.calculateDemographicsScore(customer);
    factors.demographics = demographicsScore;
    baseScore += demographicsScore * 0.2;

    // Lifecycle stage factor (15% weight)
    const lifecycleScore = this.calculateLifecycleScore(customer);
    factors.lifecycle = lifecycleScore;
    baseScore += lifecycleScore * 0.15;

    // Apply market trends and seasonality
    const marketAdjustment = await this.getMarketTrendAdjustment();
    const predictedCLV = Math.round(baseScore * marketAdjustment);

    // Calculate confidence based on data availability
    let confidence = 0.5; // Base confidence
    if (purchaseHistory.length > 1) confidence += 0.2;
    // if (customer.customerLifecycle?.length > 5) confidence += 0.2;
    if ((customer as any).dateOfBirth) confidence += 0.1;

    return {
      predictedCLV,
      confidence: Math.min(0.95, confidence),
      timeframe: '24 months',
      factors,
    };
  }

  private calculatePurchaseFrequency(transactions: any[]): number {
    if (transactions.length < 2) return 1;

    const firstPurchase = new Date(transactions[0].createdAt);
    const lastPurchase = new Date(transactions[transactions.length - 1].createdAt);
    const daysBetween = Math.ceil((lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24));

    if (daysBetween === 0) return 1;

    return transactions.length / (daysBetween / 30); // Purchases per month
  }

  private async calculateEngagementScore(customer: any): Promise<number> {
    const recentActivity = customer.customerLifecycle.slice(0, 10);
    let engagementScore = 0;

    recentActivity.forEach((activity: any) => {
      switch (activity.touchpointType) {
        case 'WEBSITE_VISIT':
          engagementScore += 1;
          break;
        case 'INQUIRY':
          engagementScore += 5;
          break;
        case 'TEST_DRIVE':
          engagementScore += 10;
          break;
        case 'EMAIL_OPENED':
          engagementScore += 2;
          break;
        case 'EMAIL_CLICKED':
          engagementScore += 3;
          break;
        default:
          engagementScore += 1;
      }
    });

    return Math.min(100, engagementScore);
  }

  private calculateDemographicsScore(customer: any): number {
    let score = 50; // Base score

    // Age factor
    if (customer.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(customer.dateOfBirth).getFullYear();
      if (age >= 25 && age <= 55) score += 20; // Prime buying age
      else if (age >= 18 && age <= 65) score += 10;
    }

    // Account completeness
    if (customer.phone) score += 5;
    if (customer.address) score += 5;
    if (customer.emailVerified) score += 10;

    // Communication preferences
    if (customer.marketingOptIn) score += 10;

    return Math.min(100, score);
  }

  private calculateLifecycleScore(customer: any): number {
    const daysSinceCreation = Math.ceil(
      (new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent customers have higher potential
    if (daysSinceCreation <= 30) return 80;
    if (daysSinceCreation <= 90) return 70;
    if (daysSinceCreation <= 180) return 60;
    if (daysSinceCreation <= 365) return 50;

    return 40; // Older customers
  }

  private async getMarketTrendAdjustment(): Promise<number> {
    // Get recent market performance
    // Mock implementation since sale model may not exist
    const lastMonth = {
      _sum: { totalAmount: Math.random() * 30000 }
    };

    const previousMonth = {
      _sum: { totalAmount: Math.random() * 25000 }
    };

    const currentRevenue = lastMonth._sum.totalAmount || 0;
    const previousRevenue = previousMonth._sum.totalAmount || 0;

    if (previousRevenue === 0) return 1.0;

    const growthRate = (currentRevenue - previousRevenue) / previousRevenue;

    // Adjust CLV based on market trend
    if (growthRate > 0.1) return 1.2; // 20% boost for strong growth
    if (growthRate > 0.05) return 1.1; // 10% boost for moderate growth
    if (growthRate < -0.1) return 0.8; // 20% reduction for decline
    if (growthRate < -0.05) return 0.9; // 10% reduction for moderate decline

    return 1.0; // No adjustment for stable market
  }
}

// Inventory Demand Prediction Model
export class InventoryDemandModel {
  async predictVehicleDemand(vehicleId: string): Promise<{
    demandScore: number;
    timeTosell: number;
    priceRecommendation: {
      currentPrice: number;
      recommendedPrice: number;
      priceAdjustment: number;
      reason: string;
    };
    marketPosition: 'underpriced' | 'competitive' | 'overpriced';
  }> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        vehicleInquiries: {
          orderBy: { createdAt: 'desc' },
        },
        // searchAnalytics: {
        //   where: {
        //     clickedVehicleId: vehicleId,
        //   },
        // },
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Calculate demand score based on multiple factors
    let demandScore = 0;

    // Interest factor (inquiries, views)
    const recentInquiries = (vehicle.vehicleInquiries || []).filter(
      (inquiry: any) => inquiry.createdAt > subDays(new Date(), 30)
    );
    demandScore += recentInquiries.length * 10;
    demandScore += ((vehicle as any).viewCount || 0) * 0.5;

    // Market data factor
    const similarVehicles = await this.getSimilarVehicleData(vehicle);
    const avgDaysOnMarket = similarVehicles.reduce((sum: number, v: any) => {
      const daysOnLot = Math.ceil((new Date().getTime() - new Date(v.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysOnLot;
    }, 0) / similarVehicles.length;

    const vehicleDaysOnLot = Math.ceil((new Date().getTime() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (vehicleDaysOnLot < avgDaysOnMarket * 0.8) {
      demandScore += 20; // High demand if selling faster than average
    } else if (vehicleDaysOnLot > avgDaysOnMarket * 1.2) {
      demandScore -= 10; // Lower demand if taking longer than average
    }

    // Price competitiveness factor
    const avgMarketPrice = similarVehicles.reduce((sum: number, v: any) => sum + v.price, 0) / similarVehicles.length;
    const priceRatio = vehicle.price / avgMarketPrice;

    if (priceRatio < 0.9) {
      demandScore += 15; // Underpriced = higher demand
    } else if (priceRatio > 1.1) {
      demandScore -= 15; // Overpriced = lower demand
    }

    // Seasonal factor
    const seasonalMultiplier = this.getSeasonalFactor(vehicle);
    demandScore *= seasonalMultiplier;

    // Normalize demand score to 0-100
    demandScore = Math.max(0, Math.min(100, demandScore));

    // Predict time to sell based on demand score and historical data
    const baseTimeToSell = avgDaysOnMarket;
    const demandAdjustment = (100 - demandScore) / 100; // Higher demand = faster sale
    const timeTosell = Math.round(baseTimeToSell * (0.5 + demandAdjustment));

    // Price recommendation
    const priceRecommendation = this.calculatePriceRecommendation(
      vehicle,
      avgMarketPrice,
      demandScore,
      vehicleDaysOnLot
    );

    // Market position
    let marketPosition: 'underpriced' | 'competitive' | 'overpriced' = 'competitive';
    if (priceRatio < 0.95) marketPosition = 'underpriced';
    else if (priceRatio > 1.05) marketPosition = 'overpriced';

    return {
      demandScore: Math.round(demandScore),
      timeTosell,
      priceRecommendation,
      marketPosition,
    };
  }

  private async getSimilarVehicleData(targetVehicle: any) {
    return await prisma.vehicle.findMany({
      where: {
        id: { not: targetVehicle.id },
        make: targetVehicle.make,
        year: {
          gte: targetVehicle.year - 2,
          lte: targetVehicle.year + 2,
        },
        price: {
          gte: targetVehicle.price * 0.8,
          lte: targetVehicle.price * 1.2,
        },
        status: 'AVAILABLE',
      },
      take: 10,
    });
  }

  private getSeasonalFactor(vehicle: any): number {
    const month = new Date().getMonth() + 1; // 1-12

    // General seasonal patterns for car sales
    if (month >= 3 && month <= 5) return 1.1; // Spring boost
    if (month >= 9 && month <= 11) return 1.1; // Fall boost
    if (month === 12 || month === 1) return 0.9; // Winter slowdown

    // SUV/4WD specific
    if (vehicle.bodyType === 'SUV' && (month >= 10 || month <= 2)) {
      return 1.2; // Winter demand for SUVs
    }

    // Convertible specific
    if (vehicle.bodyType === 'CONVERTIBLE' && month >= 4 && month <= 8) {
      return 1.3; // Summer demand for convertibles
    }

    return 1.0; // Default
  }

  private calculatePriceRecommendation(
    vehicle: any,
    avgMarketPrice: number,
    demandScore: number,
    daysOnLot: number
  ) {
    const currentPrice = vehicle.price;
    let recommendedPrice = currentPrice;
    let reason = 'Price is appropriately set';

    // If vehicle has been on lot too long, suggest price reduction
    if (daysOnLot > 90) {
      const reduction = Math.min(0.1, (daysOnLot - 90) / 1000); // Max 10% reduction
      recommendedPrice = currentPrice * (1 - reduction);
      reason = `Reduce price due to ${daysOnLot} days on lot`;
    }
    // If demand is very high and price is below market, suggest increase
    else if (demandScore > 80 && currentPrice < avgMarketPrice * 0.95) {
      recommendedPrice = Math.min(avgMarketPrice, currentPrice * 1.05);
      reason = 'Increase price due to high demand';
    }
    // If significantly overpriced, suggest reduction
    else if (currentPrice > avgMarketPrice * 1.15) {
      recommendedPrice = avgMarketPrice * 1.05;
      reason = 'Reduce price to match market average';
    }

    const priceAdjustment = ((recommendedPrice - currentPrice) / currentPrice) * 100;

    return {
      currentPrice,
      recommendedPrice: Math.round(recommendedPrice),
      priceAdjustment: Math.round(priceAdjustment * 100) / 100,
      reason,
    };
  }
}

// Lead Conversion Prediction Model
export class LeadConversionModel {
  async predictConversionProbability(inquiryId: string): Promise<{
    conversionProbability: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: Record<string, number>;
    recommendations: string[];
    estimatedValue: number;
  }> {
    const inquiry = await prisma.vehicleInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        vehicle: true,
      },
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const factors: Record<string, number> = {};
    let totalScore = 0;

    // Inquiry type factor (30% weight)
    const inquiryTypeScore = this.getInquiryTypeScore((inquiry as any).type || 'GENERAL');
    factors.inquiryType = inquiryTypeScore;
    totalScore += inquiryTypeScore * 0.3;

    // Contact completeness factor (20% weight)
    const completenessScore = this.getContactCompletenessScore(inquiry);
    factors.contactCompleteness = completenessScore;
    totalScore += completenessScore * 0.2;

    // Response time factor (25% weight)
    const responseScore = await this.getResponseTimeScore(inquiry);
    factors.responseTime = responseScore;
    totalScore += responseScore * 0.25;

    // Vehicle appeal factor (15% weight)
    const vehicleScore = await this.getVehicleAppealScore(inquiry.vehicle);
    factors.vehicleAppeal = vehicleScore;
    totalScore += vehicleScore * 0.15;

    // Timing factor (10% weight)
    const timingScore = this.getTimingScore(inquiry);
    factors.timing = timingScore;
    totalScore += timingScore * 0.1;

    // Convert to probability (0-1)
    const conversionProbability = Math.max(0, Math.min(1, totalScore / 100));

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (conversionProbability >= 0.8) grade = 'A';
    else if (conversionProbability >= 0.6) grade = 'B';
    else if (conversionProbability >= 0.4) grade = 'C';
    else if (conversionProbability >= 0.2) grade = 'D';
    else grade = 'F';

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, inquiry);

    // Estimate deal value
    const estimatedValue = inquiry.vehicle ? inquiry.vehicle.price * conversionProbability : 0;

    return {
      conversionProbability: Math.round(conversionProbability * 100) / 100,
      grade,
      factors,
      recommendations,
      estimatedValue: Math.round(estimatedValue),
    };
  }

  private getInquiryTypeScore(type: string): number {
    switch (type) {
      case 'PURCHASE_INTENT':
        return 90;
      case 'FINANCING':
        return 80;
      case 'TEST_DRIVE':
        return 70;
      case 'TRADE_IN':
        return 60;
      case 'PRICE_INQUIRY':
        return 50;
      case 'GENERAL':
        return 30;
      default:
        return 40;
    }
  }

  private getContactCompletenessScore(inquiry: any): number {
    let score = 0;

    if (inquiry.email) score += 30;
    if (inquiry.phone) score += 40;
    if (inquiry.message && inquiry.message.length > 20) score += 20;
    if (inquiry.name && inquiry.name.trim().split(' ').length >= 2) score += 10;

    return score;
  }

  private async getResponseTimeScore(inquiry: any): Promise<number> {
    // Check if there are any follow-up activities
    const customer = await prisma.user.findFirst({
      where: { email: inquiry.email },
      // include: {
      //   // customerLifecycle: {
      //   //   where: {
      //   //     timestamp: {
      //   //       gte: inquiry.createdAt,
      //   //     },
      //   //   },
      //   //   orderBy: { timestamp: 'asc' },
      //   // },
      // },
    });

    if (!customer) {
      // No response yet
      const hoursElapsed = (new Date().getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed < 1) return 100; // Still within golden hour
      if (hoursElapsed < 24) return 80;  // Within first day
      if (hoursElapsed < 72) return 60;  // Within 3 days
      return 30; // No response after 3 days
    }

    // Calculate response time (simplified since customerLifecycle is not available)
    const hoursElapsed = (new Date().getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed < 1) return 100; // Still within golden hour
    if (hoursElapsed < 24) return 80;  // Within first day
    if (hoursElapsed < 72) return 60;  // Within 3 days
    return 30; // No response after 3 days
  }

  private async getVehicleAppealScore(vehicle: any): Promise<number> {
    if (!vehicle) return 50;

    let score = 50; // Base score

    // High-demand features
    if (vehicle.fuelType === 'HYBRID' || vehicle.fuelType === 'ELECTRIC') score += 15;
    if (vehicle.mileage < 50000) score += 10;
    if (vehicle.year >= new Date().getFullYear() - 3) score += 15;

    // Market position
    const avgPrice = await this.getAveragePriceForSimilarVehicles(vehicle);
    if (avgPrice > 0) {
      const priceRatio = vehicle.price / avgPrice;
      if (priceRatio < 0.9) score += 10; // Good value
      else if (priceRatio > 1.1) score -= 10; // Expensive
    }

    // Interest indicators
    score += Math.min(20, vehicle.viewCount / 10);
    score += Math.min(15, vehicle.inquiryCount * 5);

    return Math.max(0, Math.min(100, score));
  }

  private async getAveragePriceForSimilarVehicles(vehicle: any): Promise<number> {
    const similar = await prisma.vehicle.aggregate({
      where: {
        make: vehicle.make,
        model: vehicle.model,
        year: {
          gte: vehicle.year - 2,
          lte: vehicle.year + 2,
        },
        status: 'AVAILABLE',
      },
      _avg: {
        price: true,
      },
    });

    return similar._avg.price || 0;
  }

  private getTimingScore(inquiry: any): number {
    const dayOfWeek = inquiry.createdAt.getDay(); // 0 = Sunday
    const hour = inquiry.createdAt.getHours();

    let score = 50; // Base score

    // Business hours boost
    if (hour >= 9 && hour <= 17) score += 20;
    else if (hour >= 8 && hour <= 19) score += 10;

    // Weekday boost
    if (dayOfWeek >= 1 && dayOfWeek <= 5) score += 15;
    else if (dayOfWeek === 6) score += 5; // Saturday

    // Time since submission
    const hoursAgo = (new Date().getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) score += 15; // Fresh inquiry

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(factors: Record<string, number>, inquiry: any): string[] {
    const recommendations: string[] = [];

    if (factors.responseTime < 70) {
      recommendations.push('Follow up immediately - response time is critical for conversion');
    }

    if (factors.contactCompleteness < 60) {
      recommendations.push('Request additional contact information for better qualification');
    }

    if (factors.inquiryType >= 70) {
      recommendations.push('High-intent lead - prioritize for immediate contact');
    }

    if (factors.vehicleAppeal < 50) {
      recommendations.push('Consider highlighting vehicle unique features or value proposition');
    }

    if (inquiry.type === 'FINANCING') {
      recommendations.push('Prepare financing options and pre-approval information');
    }

    if (inquiry.type === 'TEST_DRIVE') {
      recommendations.push('Schedule test drive appointment within 24 hours');
    }

    return recommendations;
  }
}

// Export model instances
export const salesForecast = new SalesForecastModel();
export const clvPrediction = new CLVPredictionModel();
export const inventoryDemand = new InventoryDemandModel();
export const leadConversion = new LeadConversionModel();