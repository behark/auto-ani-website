'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Car,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SalesForecast {
  predictions: Array<{
    month: string;
    predictedRevenue: number;
    confidence: number;
  }>;
  modelAccuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PredictionsData {
  salesForecast: SalesForecast | null;
  lastUpdated: string;
}

const PredictiveDashboard: React.FC = () => {
  const [predictionsData, setPredictionsData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [vehicleDemandData, setVehicleDemandData] = useState<any>(null);
  const [customerCLVData, setCustomerCLVData] = useState<any>(null);
  const [leadConversionData, setLeadConversionData] = useState<any>(null);

  const fetchPredictionsOverview = async () => {
    try {
      const response = await fetch('/api/analytics/predictions?type=overview');
      if (!response.ok) throw new Error('Failed to fetch predictions');

      const data = await response.json();
      setPredictionsData(data);
    } catch (error) {
      logger.error('Error fetching predictions:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDemand = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/analytics/predictions?type=vehicle_demand&id=${vehicleId}`);
      if (!response.ok) throw new Error('Failed to fetch vehicle demand');

      const data = await response.json();
      setVehicleDemandData(data);
    } catch (error) {
      logger.error('Error fetching vehicle demand:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const fetchCustomerCLV = async (customerId: string) => {
    try {
      const response = await fetch(`/api/analytics/predictions?type=customer_clv&id=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer CLV');

      const data = await response.json();
      setCustomerCLVData(data);
    } catch (error) {
      logger.error('Error fetching customer CLV:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const fetchLeadConversion = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/analytics/predictions?type=lead_conversion&id=${inquiryId}`);
      if (!response.ok) throw new Error('Failed to fetch lead conversion');

      const data = await response.json();
      setLeadConversionData(data);
    } catch (error) {
      logger.error('Error fetching lead conversion:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  useEffect(() => {
    fetchPredictionsOverview();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">High Confidence</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
    return <Badge variant="destructive">Low Confidence</Badge>;
  };

  const getGradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      F: 'bg-red-500'
    };
    return <Badge className={colors[grade] || 'bg-gray-500'}>Grade {grade}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Predictive Analytics</h1>
            <p className="text-muted-foreground">AI-powered business forecasting and insights</p>
          </div>
        </div>
        <Button onClick={fetchPredictionsOverview} variant="outline">
          Refresh Predictions
        </Button>
      </div>

      <Tabs defaultValue="sales-forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales-forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="vehicle-demand">Vehicle Demand</TabsTrigger>
          <TabsTrigger value="customer-clv">Customer CLV</TabsTrigger>
          <TabsTrigger value="lead-conversion">Lead Conversion</TabsTrigger>
        </TabsList>

        {/* Sales Forecast Tab */}
        <TabsContent value="sales-forecast" className="space-y-6">
          {predictionsData?.salesForecast ? (
            <>
              {/* Forecast Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(predictionsData.salesForecast.modelAccuracy * 100).toFixed(1)}%
                    </div>
                    {getConfidenceBadge(predictionsData.salesForecast.modelAccuracy)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Trend</CardTitle>
                    {getTrendIcon(predictionsData.salesForecast.trend)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {predictionsData.salesForecast.trend}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on historical data
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{(predictionsData.salesForecast.predictions[0]?.predictedRevenue / 100 || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {(predictionsData.salesForecast.predictions[0]?.confidence * 100 || 0).toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>
                    Predicted monthly revenue with confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={predictionsData.salesForecast.predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `€${(value / 100).toLocaleString()}`} />
                      <Tooltip
                        formatter={(value: number) => [`€${(value / 100).toLocaleString()}`, 'Predicted Revenue']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="predictedRevenue"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sales forecast data available</p>
                  <p className="text-sm text-muted-foreground">Need at least 3 months of historical data</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vehicle Demand Tab */}
        <TabsContent value="vehicle-demand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Demand Analysis</CardTitle>
              <CardDescription>
                Predict demand and optimal pricing for specific vehicles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Vehicle ID"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => fetchVehicleDemand(selectedVehicleId)}
                  disabled={!selectedVehicleId}
                >
                  Analyze Demand
                </Button>
              </div>

              {vehicleDemandData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Demand Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vehicleDemandData.demandScore}/100</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${vehicleDemandData.demandScore}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Estimated Time to Sell</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vehicleDemandData.timeTosell} days</div>
                        <Badge variant={vehicleDemandData.timeTosell < 60 ? "default" : "destructive"}>
                          {vehicleDemandData.timeTosell < 60 ? "Fast" : "Slow"}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Market Position</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold capitalize">{vehicleDemandData.marketPosition}</div>
                        <Badge variant={
                          vehicleDemandData.marketPosition === 'competitive' ? "default" :
                          vehicleDemandData.marketPosition === 'underpriced' ? "secondary" : "destructive"
                        }>
                          {vehicleDemandData.marketPosition}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Price Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-lg font-bold">€{vehicleDemandData.priceRecommendation.currentPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Recommended Price</p>
                          <p className="text-lg font-bold">€{vehicleDemandData.priceRecommendation.recommendedPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Adjustment</p>
                          <p className={`text-lg font-bold ${vehicleDemandData.priceRecommendation.priceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {vehicleDemandData.priceRecommendation.priceAdjustment >= 0 ? '+' : ''}{vehicleDemandData.priceRecommendation.priceAdjustment.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reason</p>
                          <p className="text-sm">{vehicleDemandData.priceRecommendation.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer CLV Tab */}
        <TabsContent value="customer-clv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value Prediction</CardTitle>
              <CardDescription>
                Predict the total value a customer will bring over their lifetime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Customer ID"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => fetchCustomerCLV(selectedCustomerId)}
                  disabled={!selectedCustomerId}
                >
                  Predict CLV
                </Button>
              </div>

              {customerCLVData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Predicted CLV</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">€{(customerCLVData.predictedCLV / 100).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Over {customerCLVData.timeframe}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Confidence Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(customerCLVData.confidence * 100).toFixed(0)}%</div>
                        {getConfidenceBadge(customerCLVData.confidence)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Primary Factor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {Object.entries(customerCLVData.factors).reduce((a, b) =>
                            customerCLVData.factors[a[0]] > customerCLVData.factors[b[0]] ? a : b
                          )[0].replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>CLV Factors Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(customerCLVData.factors).map(([key, value]) => ({
                          factor: key.replace(/([A-Z])/g, ' $1').trim(),
                          value: value as number
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="factor" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Conversion Tab */}
        <TabsContent value="lead-conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Conversion Prediction</CardTitle>
              <CardDescription>
                Analyze the probability of converting a lead into a sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Inquiry ID"
                  value={selectedInquiryId}
                  onChange={(e) => setSelectedInquiryId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => fetchLeadConversion(selectedInquiryId)}
                  disabled={!selectedInquiryId}
                >
                  Analyze Lead
                </Button>
              </div>

              {leadConversionData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Conversion Probability</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(leadConversionData.conversionProbability * 100).toFixed(0)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${leadConversionData.conversionProbability * 100}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Lead Grade</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{leadConversionData.grade}</div>
                        {getGradeBadge(leadConversionData.grade)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Estimated Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">€{(leadConversionData.estimatedValue / 100).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">If converted</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">{leadConversionData.recommendations.length}</div>
                        <p className="text-xs text-muted-foreground">Action items</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {leadConversionData.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Factors Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(leadConversionData.factors).map(([key, value]) => ({
                          factor: key.replace(/([A-Z])/g, ' $1').trim(),
                          value: value as number
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="factor" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveDashboard;