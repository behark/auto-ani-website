'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  RefreshCw,
  Download,
} from 'lucide-react';

interface MarketData {
  summary: {
    totalMarketListings: number;
    avgMarketPrice: number;
    avgOurPrice: number;
    priceCompetitiveness: number;
    ourInventoryCount: number;
  };
  competitors: Array<{
    name: string;
    listings: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    locations: string[];
    makes: string[];
    models: string[];
    marketShare: number;
  }>;
  pricing: Array<{
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    currentPrice: number;
    suggestedPrice: number;
    recommendation: string;
    reason: string;
    confidence: string;
    potentialImpact: number;
    profitImpact: number;
    marketAnalysis: {
      avgMarketPrice: number;
      medianMarketPrice: number;
      minMarketPrice: number;
      maxMarketPrice: number;
      pricePercentile: number;
      competitorCount: number;
    };
  }>;
  demand: {
    byMake: Record<string, { listings: number; avgPrice: number; marketShare: number }>;
    byPriceRange: Array<{ range: string; listings: number; percentage: number }>;
  };
  trends: Array<{
    date: string;
    avgPrice: number;
    listings: number;
    minPrice: number;
    maxPrice: number;
  }>;
  ourVehicles: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    costPrice: number;
    status: string;
    viewCount: number;
    inquiryCount: number;
    testDriveCount: number;
    profitMargin: number;
    avgMarketPrice: number;
    pricePosition: string;
    competitiveAdvantage: number;
    competitorCount: number;
  }>;
}

interface MarketDashboardProps {
  period: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const RECOMMENDATION_COLORS = {
  INCREASE: '#10B981',
  DECREASE: '#EF4444',
  MAINTAIN: '#6B7280',
};

const POSITION_COLORS = {
  BELOW_MARKET: '#10B981',
  AT_MARKET: '#3B82F6',
  ABOVE_MARKET: '#F59E0B',
  PREMIUM: '#8B5CF6',
};

export default function MarketDashboard({ period }: MarketDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [priceUpdateMode, setPriceUpdateMode] = useState(false);


  // Load market data
  const loadMarketData = async () => {
    try {
      const response = await fetch(`/api/analytics/market?days=${period}`);
      const result = await response.json();

      if (result.success) {
        setMarketData(result.data);
      } else {
        toast.error('Failed to load market data');
      }
    } catch (error) {
      logger.error('Error loading market data:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to load market analytics');
    }
  };

  // Apply pricing recommendations
  const applyPricingRecommendations = async () => {
    if (!marketData) return;

    setUpdating(true);
    try {
      const recommendations = marketData.pricing.filter(rec => rec.recommendation !== 'MAINTAIN');

      const response = await fetch('/api/analytics/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkPriceUpdate',
          recommendations,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Updated pricing for ${result.data.updatedCount} vehicles`);
        await loadMarketData();
        setPriceUpdateMode(false);
      } else {
        toast.error('Failed to update pricing');
      }
    } catch (error) {
      logger.error('Error updating prices:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to apply pricing recommendations');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadMarketData();
      setLoading(false);
    };

    loadData();
  }, [period]);

  // Real-time updates disabled (socket removed for memory optimization)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No market data available</p>
      </div>
    );
  }

  // Prepare chart data
  const competitorData = marketData.competitors.slice(0, 10).map(comp => ({
    name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
    listings: comp.listings,
    avgPrice: comp.avgPrice / 100,
    marketShare: comp.marketShare,
  }));

  const demandByMakeData = Object.entries(marketData.demand.byMake).map(([make, data]) => ({
    make,
    listings: data.listings,
    avgPrice: data.avgPrice / 100,
    marketShare: data.marketShare,
  }));

  const priceRangeData = marketData.demand.byPriceRange.map(item => ({
    range: item.range,
    listings: item.listings,
    percentage: item.percentage,
  }));

  const trendData = marketData.trends.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    avgPrice: item.avgPrice / 100,
    listings: item.listings,
    minPrice: item.minPrice / 100,
    maxPrice: item.maxPrice / 100,
  }));

  // Pricing recommendations
  const pricingRecommendations = marketData.pricing.filter(rec => rec.recommendation !== 'MAINTAIN');
  const highConfidenceRecs = pricingRecommendations.filter(rec => rec.confidence === 'HIGH');

  // Competitive positioning scatter plot
  const competitiveData = marketData.ourVehicles.map(vehicle => ({
    x: vehicle.avgMarketPrice / 100,
    y: vehicle.price / 100,
    z: vehicle.inquiryCount,
    make: vehicle.make,
    model: vehicle.model,
    position: vehicle.pricePosition,
    advantage: vehicle.competitiveAdvantage,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Market Listings</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.summary.totalMarketListings}</p>
                <p className="text-xs text-gray-500">Total tracked</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Market Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(marketData.summary.avgMarketPrice / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Competitor average</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Our Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(marketData.summary.avgOurPrice / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{marketData.summary.ourInventoryCount} vehicles</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Price Competitiveness</p>
                <p className="text-2xl font-bold text-gray-900">
                  {marketData.summary.priceCompetitiveness > 0 ? '+' : ''}{marketData.summary.priceCompetitiveness.toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  {marketData.summary.priceCompetitiveness > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${marketData.summary.priceCompetitiveness > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    vs market
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Price Recommendations</p>
                <p className="text-2xl font-bold text-gray-900">{pricingRecommendations.length}</p>
                <p className="text-xs text-gray-500">{highConfidenceRecs.length} high confidence</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setPriceUpdateMode(!priceUpdateMode)}
            variant={priceUpdateMode ? 'default' : 'outline'}
          >
            <Target className="h-4 w-4 mr-2" />
            Pricing Mode
          </Button>
          {priceUpdateMode && (
            <Button
              onClick={applyPricingRecommendations}
              disabled={updating || pricingRecommendations.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {updating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Apply Recommendations ({pricingRecommendations.length})
            </Button>
          )}
        </div>
        <Button
          onClick={loadMarketData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Market Price Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `€${value.toLocaleString()}`} />
                  <Tooltip
                    formatter={(value: any, name) => [
                      `€${value.toLocaleString()}`,
                      name === 'avgPrice' ? 'Avg Price' :
                      name === 'minPrice' ? 'Min Price' : 'Max Price'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgPrice"
                    stroke="#3B82F6"
                    fill="url(#priceGradient)"
                  />
                  <Line type="monotone" dataKey="minPrice" stroke="#10B981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="maxPrice" stroke="#EF4444" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competitorData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'avgPrice' ? `€${value.toLocaleString()}` :
                      name === 'marketShare' ? `${value.toFixed(1)}%` : value,
                      name === 'avgPrice' ? 'Avg Price' :
                      name === 'marketShare' ? 'Market Share' : 'Listings'
                    ]}
                  />
                  <Bar dataKey="listings" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demand by Make */}
        <Card>
          <CardHeader>
            <CardTitle>Market Demand by Make</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandByMakeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="make" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'avgPrice' ? `€${value.toLocaleString()}` :
                      name === 'marketShare' ? `${value.toFixed(1)}%` : value,
                      name === 'avgPrice' ? 'Avg Price' :
                      name === 'marketShare' ? 'Market Share' : 'Listings'
                    ]}
                  />
                  <Bar dataKey="listings" fill="#3B82F6" name="Listings" />
                  <Bar dataKey="marketShare" fill="#10B981" name="Market Share %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Positioning */}
        <Card>
          <CardHeader>
            <CardTitle>Our Pricing vs Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={competitiveData}>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Market Price"
                    tickFormatter={(value) => `€${value.toLocaleString()}`}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Our Price"
                    tickFormatter={(value) => `€${value.toLocaleString()}`}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-medium">{data.make} {data.model}</p>
                            <p>Market Price: €{data.x.toLocaleString()}</p>
                            <p>Our Price: €{data.y.toLocaleString()}</p>
                            <p>Inquiries: {data.z}</p>
                            <p>Position: {data.position}</p>
                            <p>Advantage: {data.advantage.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="y" fill="#3B82F6" />
                  {/* Perfect price line (45 degree) */}
                  <Line
                    data={[
                      { x: 0, y: 0 },
                      { x: 100000, y: 100000 }
                    ]}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Recommendations */}
      {priceUpdateMode && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-left p-2">Current Price</th>
                    <th className="text-left p-2">Suggested Price</th>
                    <th className="text-left p-2">Recommendation</th>
                    <th className="text-left p-2">Impact</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRecommendations.slice(0, 20).map((rec) => (
                    <tr key={rec.vehicleId} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{rec.make} {rec.model}</p>
                          <p className="text-sm text-gray-500">{rec.year}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <p className="font-medium">€{(rec.currentPrice / 100).toLocaleString()}</p>
                      </td>
                      <td className="p-2">
                        <p className="font-medium">€{(rec.suggestedPrice / 100).toLocaleString()}</p>
                        <p className={`text-sm ${rec.suggestedPrice > rec.currentPrice ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.suggestedPrice > rec.currentPrice ? '+' : ''}
                          €{Math.abs(rec.suggestedPrice - rec.currentPrice) / 100}
                        </p>
                      </td>
                      <td className="p-2">
                        <Badge
                          style={{
                            backgroundColor: RECOMMENDATION_COLORS[rec.recommendation as keyof typeof RECOMMENDATION_COLORS],
                            color: 'white'
                          }}
                        >
                          {rec.recommendation}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">€{(rec.potentialImpact / 100).toLocaleString()}</p>
                        {rec.profitImpact !== 0 && (
                          <p className={`text-xs ${rec.profitImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {rec.profitImpact > 0 ? '+' : ''}{rec.profitImpact.toFixed(1)}% margin
                          </p>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={rec.confidence === 'HIGH' ? 'default' : 'secondary'}
                        >
                          {rec.confidence}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pricingRecommendations.length > 20 && (
                <div className="text-center py-4 text-gray-500">
                  Showing 20 of {pricingRecommendations.length} recommendations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Our Vehicles Market Position */}
      <Card>
        <CardHeader>
          <CardTitle>Our Vehicles Market Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vehicle</th>
                  <th className="text-left p-2">Our Price</th>
                  <th className="text-left p-2">Market Avg</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Advantage</th>
                  <th className="text-left p-2">Competitors</th>
                  <th className="text-left p-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {marketData.ourVehicles.slice(0, 15).map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-500">{vehicle.year}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">€{(vehicle.price / 100).toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">€{(vehicle.avgMarketPrice / 100).toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <Badge
                        style={{
                          backgroundColor: POSITION_COLORS[vehicle.pricePosition as keyof typeof POSITION_COLORS],
                          color: 'white'
                        }}
                      >
                        {vehicle.pricePosition.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <p className={`font-medium ${vehicle.competitiveAdvantage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {vehicle.competitiveAdvantage > 0 ? '+' : ''}{vehicle.competitiveAdvantage.toFixed(1)}%
                      </p>
                    </td>
                    <td className="p-2">
                      <p className="text-sm">{vehicle.competitorCount} similar</p>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs">{vehicle.viewCount}</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs">{vehicle.inquiryCount}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}