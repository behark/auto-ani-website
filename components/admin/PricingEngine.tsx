'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  TrendingUp,
  Settings,
  Save,
  Calculator,
  Target,
  BarChart3,
} from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  condition: string;
  adjustment: number;
  adjustmentType: 'PERCENTAGE' | 'FIXED';
  isActive: boolean;
  priority: number;
}

interface MarketData {
  make: string;
  model: string;
  year: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  marketTrend: 'UP' | 'DOWN' | 'STABLE';
  competitorCount: number;
}

interface PricingSuggestion {
  vehicleId: string;
  vehicleName: string;
  currentPrice: number;
  suggestedPrice: number;
  reasoning: string;
  confidence: number;
  marketPosition: 'ABOVE' | 'BELOW' | 'COMPETITIVE';
}

export default function PricingEngine() {
  const [loading, setLoading] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [autoAdjustment, setAutoAdjustment] = useState(false);
  const [selectedTab, setSelectedTab] = useState('rules');

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    setLoading(true);
    try {
      const [rulesResponse, marketResponse, suggestionsResponse] = await Promise.all([
        fetch('/api/admin/pricing/rules'),
        fetch('/api/admin/pricing/market-data'),
        fetch('/api/admin/pricing/suggestions'),
      ]);

      const rulesData = await rulesResponse.json();
      const marketDataResult = await marketResponse.json();
      const suggestionsData = await suggestionsResponse.json();

      if (rulesData.success) {
        setPricingRules(rulesData.rules);
      } else {
        // Mock data
        setPricingRules([
          {
            id: '1',
            name: 'High Mileage Discount',
            condition: 'mileage > 100000',
            adjustment: -5,
            adjustmentType: 'PERCENTAGE',
            isActive: true,
            priority: 1,
          },
          {
            id: '2',
            name: 'Premium Brand Markup',
            condition: "make IN ('BMW', 'Mercedes', 'Audi')",
            adjustment: 10,
            adjustmentType: 'PERCENTAGE',
            isActive: true,
            priority: 2,
          },
          {
            id: '3',
            name: 'Age Depreciation',
            condition: 'age > 5',
            adjustment: -2,
            adjustmentType: 'PERCENTAGE',
            isActive: true,
            priority: 3,
          },
        ]);
      }

      if (marketDataResult.success) {
        setMarketData(marketDataResult.data);
      } else {
        // Mock market data
        setMarketData([
          {
            make: 'Audi',
            model: 'A4',
            year: 2018,
            averagePrice: 22500,
            priceRange: { min: 18000, max: 28000 },
            marketTrend: 'STABLE',
            competitorCount: 15,
          },
          {
            make: 'BMW',
            model: '320d',
            year: 2019,
            averagePrice: 28000,
            priceRange: { min: 24000, max: 32000 },
            marketTrend: 'UP',
            competitorCount: 12,
          },
        ]);
      }

      if (suggestionsData.success) {
        setSuggestions(suggestionsData.suggestions);
      } else {
        // Mock suggestions
        setSuggestions([
          {
            vehicleId: '1',
            vehicleName: 'Audi A4 S-Line 2018',
            currentPrice: 25000,
            suggestedPrice: 23500,
            reasoning: 'Current price is 11% above market average. Reducing price could improve competitiveness.',
            confidence: 85,
            marketPosition: 'ABOVE',
          },
          {
            vehicleId: '2',
            vehicleName: 'BMW 320d 2019',
            currentPrice: 26000,
            suggestedPrice: 28000,
            reasoning: 'Price is below market average. Increasing could maximize profit while staying competitive.',
            confidence: 78,
            marketPosition: 'BELOW',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error loading pricing data:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const savePricingRule = async (rule: Partial<PricingRule>) => {
    try {
      const method = rule.id ? 'PUT' : 'POST';
      const url = rule.id ? `/api/admin/pricing/rules/${rule.id}` : '/api/admin/pricing/rules';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (response.ok) {
        await loadPricingData();
      }
    } catch (error) {
      logger.error('Error saving pricing rule:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    await savePricingRule({ id: ruleId, isActive });
  };

  const applySuggestion = async (suggestion: PricingSuggestion) => {
    try {
      const response = await fetch(`/api/vehicles/${suggestion.vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: suggestion.suggestedPrice,
        }),
      });

      if (response.ok) {
        await loadPricingData();
      }
    } catch (error) {
      logger.error('Error applying suggestion:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const runPricingAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pricing/analyze', {
        method: 'POST',
      });

      if (response.ok) {
        await loadPricingData();
      }
    } catch (error) {
      logger.error('Error running pricing analysis:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'DOWN':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Intelligent Pricing Engine</h2>
          <p className="text-gray-600">Automated pricing optimization based on market data</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-adjustment">Auto Adjustment</Label>
            <Switch
              id="auto-adjustment"
              checked={autoAdjustment}
              onCheckedChange={setAutoAdjustment}
            />
          </div>
          <Button onClick={runPricingAnalysis} disabled={loading}>
            <Calculator className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">
            <Settings className="w-4 h-4 mr-2" />
            Pricing Rules
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Target className="w-4 h-4 mr-2" />
            Price Suggestions ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="market">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Rule */}
            <Card>
              <CardHeader>
                <CardTitle>Create Pricing Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., High Mileage Discount"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    placeholder="e.g., mileage > 100000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adjustment">Adjustment</Label>
                    <Input
                      id="adjustment"
                      type="number"
                      placeholder="e.g., -5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adjustment-type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Rule
                </Button>
              </CardContent>
            </Card>

            {/* Existing Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Active Pricing Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.condition}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={rule.adjustmentType === 'PERCENTAGE' ? 'default' : 'secondary'}>
                            {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}
                            {rule.adjustmentType === 'PERCENTAGE' ? '%' : '€'}
                          </Badge>
                          <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                        </div>
                      </div>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.vehicleId}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{suggestion.vehicleName}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-600">Current Price</p>
                          <p className="font-bold">{formatCurrency(suggestion.currentPrice)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Suggested Price</p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(suggestion.suggestedPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Difference</p>
                          <p className={`font-bold ${
                            suggestion.suggestedPrice > suggestion.currentPrice
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {suggestion.suggestedPrice > suggestion.currentPrice ? '+' : ''}
                            {formatCurrency(suggestion.suggestedPrice - suggestion.currentPrice)}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-3">{suggestion.reasoning}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge
                          variant={
                            suggestion.marketPosition === 'COMPETITIVE' ? 'default' :
                            suggestion.marketPosition === 'ABOVE' ? 'destructive' : 'secondary'
                          }
                        >
                          {suggestion.marketPosition}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Confidence: {suggestion.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {suggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No pricing suggestions available. Run analysis to generate suggestions.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="market">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketData.map((data, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {data.make} {data.model} ({data.year})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Price</span>
                    <span className="font-bold">{formatCurrency(data.averagePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Range</span>
                    <span className="text-sm">
                      {formatCurrency(data.priceRange.min)} - {formatCurrency(data.priceRange.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Trend</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(data.marketTrend)}
                      <span className="text-sm">{data.marketTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Competitors</span>
                    <span className="text-sm">{data.competitorCount} listings</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}