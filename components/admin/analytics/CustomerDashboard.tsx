'use client';

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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Heart,
  Star,
  AlertTriangle,
  Crown,
  Target,
} from 'lucide-react';

interface CustomerData {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    customerGrowth: number;
    activeCustomers: number;
    avgLifetimeValue: number;
  };
  segmentation: {
    byLifetimeValue: Record<string, { count: number; totalValue: number; threshold: number }>;
    byPurchaseCount: Record<string, number>;
    byAcquisitionSource: Record<string, { count: number; totalValue: number; avgCost: number }>;
    byStage: Record<string, { count: number; totalValue: number }>;
    byRisk: Record<string, { count: number; totalValue: number }>;
  };
  acquisition: {
    newCustomers: number;
    totalAcquisitionCost: number;
    avgAcquisitionCost: number;
    sourceBreakdown: Record<string, { count: number; cost: number }>;
  };
  retention: {
    cohorts: any[];
    periodDays: number;
  };
  churn: {
    churned: number;
    atRisk: number;
    churnRate: number;
    churnedValue: number;
    atRiskValue: number;
  };
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    lastLoginAt: string;
    lifetimeValue: number;
    totalSpent: number;
    serviceRevenue: number;
    purchaseCount: number;
    avgOrderValue: number;
    daysSinceLastPurchase: number;
    serviceAppointments: number;
    currentStage: string;
    acquisitionSource: string;
    acquisitionCost: number;
    marketingOptIn: boolean;
    smsOptIn: boolean;
    loyaltyTier: string;
    loyaltyPoints: number;
    riskLevel: string;
    creditScore: number;
  }>;
}

interface CustomerDashboardProps {
  period: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#DC2626',
};

const LOYALTY_TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF',
};

export default function CustomerDashboard({ period }: CustomerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');


  // Load customer data
  const loadCustomerData = async () => {
    try {
      const response = await fetch(`/api/analytics/customers?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setCustomerData(result.data);
      } else {
        toast.error('Failed to load customer data');
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load customer analytics');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadCustomerData();
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

  if (!customerData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No customer data available</p>
      </div>
    );
  }

  // Prepare chart data
  const lifetimeValueData = Object.entries(customerData.segmentation.byLifetimeValue).map(([segment, data]) => ({
    name: segment === 'high' ? 'High Value (€500+)' : segment === 'medium' ? 'Medium Value (€200-€500)' : 'Low Value (<€200)',
    count: data.count,
    totalValue: data.totalValue / 100,
    avgValue: data.count > 0 ? data.totalValue / data.count / 100 : 0,
  }));

  const purchaseSegmentData = Object.entries(customerData.segmentation.byPurchaseCount).map(([segment, count]) => ({
    name: segment === 'frequent' ? 'Frequent (3+)' :
          segment === 'occasional' ? 'Occasional (2)' :
          segment === 'singlePurchase' ? 'Single Purchase' : 'Prospects',
    count: count as number,
  }));

  const acquisitionSourceData = Object.entries(customerData.segmentation.byAcquisitionSource).map(([source, data]) => ({
    name: source,
    count: data.count,
    totalValue: data.totalValue / 100,
    avgCost: data.avgCost / 100,
    roi: data.totalValue > 0 && data.avgCost > 0 ? ((data.totalValue - data.avgCost) / data.avgCost) * 100 : 0,
  }));

  const stageData = Object.entries(customerData.segmentation.byStage).map(([stage, data]) => ({
    name: stage,
    count: data.count,
    totalValue: data.totalValue / 100,
  }));

  const riskData = Object.entries(customerData.segmentation.byRisk).map(([risk, data]) => ({
    name: risk,
    count: data.count,
    totalValue: data.totalValue / 100,
    color: RISK_COLORS[risk as keyof typeof RISK_COLORS] || '#6B7280',
  }));

  // Filter customers by selected segment
  const filteredCustomers = selectedSegment === 'all'
    ? customerData.customers
    : customerData.customers.filter(c => {
        switch (selectedSegment) {
          case 'high_value':
            return c.lifetimeValue >= 50000;
          case 'at_risk':
            return c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL';
          case 'new':
            return new Date(c.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          case 'vip':
            return c.loyaltyTier === 'GOLD' || c.loyaltyTier === 'PLATINUM' || c.loyaltyTier === 'DIAMOND';
          default:
            return true;
        }
      });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.summary.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.summary.newCustomers}</p>
                <div className="flex items-center mt-1">
                  {customerData.summary.customerGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${customerData.summary.customerGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customerData.summary.customerGrowth > 0 ? '+' : ''}{customerData.summary.customerGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.summary.activeCustomers}</p>
                <p className="text-xs text-gray-500">
                  {((customerData.summary.activeCustomers / customerData.summary.totalCustomers) * 100).toFixed(1)}% active
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(customerData.summary.avgLifetimeValue / 100).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.churn.churnRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{customerData.churn.atRisk} at risk</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Lifetime Value Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Lifetime Value Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lifetimeValueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'totalValue' ? `€${value.toLocaleString()}` :
                      name === 'avgValue' ? `€${value.toLocaleString()}` : value,
                      name === 'totalValue' ? 'Total Value' :
                      name === 'avgValue' ? 'Avg Value' : 'Count'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3B82F6" name="Count" />
                  <Bar dataKey="avgValue" fill="#10B981" name="Avg Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Behavior Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchaseSegmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {purchaseSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Source ROI */}
        <Card>
          <CardHeader>
            <CardTitle>Acquisition Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acquisitionSourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'roi' ? `${value.toFixed(1)}%` :
                      name === 'avgCost' || name === 'totalValue' ? `€${value.toLocaleString()}` : value,
                      name === 'roi' ? 'ROI' :
                      name === 'avgCost' ? 'Avg Cost' :
                      name === 'totalValue' ? 'Total Value' : 'Count'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3B82F6" name="Count" />
                  <Bar dataKey="roi" fill="#10B981" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Lifecycle Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lifecycle Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stageData}>
                  <defs>
                    <linearGradient id="stageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'totalValue' ? `€${value.toLocaleString()}` : value,
                      name === 'totalValue' ? 'Total Value' : 'Count'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8B5CF6"
                    fill="url(#stageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {riskData.map((risk, index) => (
              <div key={index} className="text-center">
                <div
                  className="p-4 rounded-lg mb-2"
                  style={{ backgroundColor: `${risk.color}20` }}
                >
                  <AlertTriangle className="h-8 w-8 mx-auto" style={{ color: risk.color }} />
                </div>
                <p className="text-2xl font-bold">{risk.count}</p>
                <p className="text-sm text-gray-600">{risk.name} Risk</p>
                <p className="text-xs text-gray-500">€{risk.totalValue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Details</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Customers</option>
                <option value="high_value">High Value (€500+)</option>
                <option value="at_risk">At Risk</option>
                <option value="new">New (30 days)</option>
                <option value="vip">VIP (Gold+)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">LTV</th>
                  <th className="text-left p-2">Purchases</th>
                  <th className="text-left p-2">Stage</th>
                  <th className="text-left p-2">Loyalty</th>
                  <th className="text-left p-2">Risk</th>
                  <th className="text-left p-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, 20).map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">€{(customer.lifetimeValue / 100).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        Avg: €{customer.purchaseCount > 0 ? (customer.avgOrderValue / 100).toLocaleString() : '0'}
                      </p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{customer.purchaseCount}</p>
                      {customer.daysSinceLastPurchase && (
                        <p className="text-sm text-gray-500">
                          {customer.daysSinceLastPurchase} days ago
                        </p>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">
                        {customer.currentStage}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {customer.loyaltyTier && (
                        <div className="flex items-center">
                          <Crown
                            className="h-4 w-4 mr-1"
                            style={{ color: LOYALTY_TIER_COLORS[customer.loyaltyTier as keyof typeof LOYALTY_TIER_COLORS] }}
                          />
                          <span className="text-sm">{customer.loyaltyTier}</span>
                        </div>
                      )}
                      {customer.loyaltyPoints > 0 && (
                        <p className="text-xs text-gray-500">{customer.loyaltyPoints} pts</p>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge
                        style={{
                          backgroundColor: RISK_COLORS[customer.riskLevel as keyof typeof RISK_COLORS],
                          color: 'white'
                        }}
                      >
                        {customer.riskLevel}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <p className="text-sm">{customer.acquisitionSource || 'Unknown'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length > 20 && (
              <div className="text-center py-4 text-gray-500">
                Showing 20 of {filteredCustomers.length} customers
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}