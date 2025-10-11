'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Calendar,
} from 'lucide-react';

interface SalesData {
  summary: {
    totalRevenue: number;
    revenueGrowth: number;
    totalUnits: number;
    unitGrowth: number;
    avgDealSize: number;
    dealSizeGrowth: number;
  };
  breakdown: {
    byVehicleType: Record<string, { revenue: number; units: number }>;
    byBrand: Record<string, { revenue: number; units: number; profit: number }>;
    bySalesPerson: Record<string, any>;
  };
  trends: {
    monthly: Array<{ period: string; revenue: number; units: number; profit: number; avgDealSize: number }>;
    weekly: Array<{ period: string; revenue: number; units: number; profit: number; avgDealSize: number }>;
  };
}

interface SalesDashboardProps {
  period: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function SalesDashboard({ period }: SalesDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [funnelData, setFunnelData] = useState<any>(null);


  // Load sales data
  const loadSalesData = async () => {
    try {
      const response = await fetch(`/api/analytics/sales?period=monthly&days=${period}`);
      const result = await response.json();

      if (result.success) {
        setSalesData(result.data);
      } else {
        toast.error('Failed to load sales data');
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales analytics');
    }
  };

  // Load funnel data
  const loadFunnelData = async () => {
    try {
      const response = await fetch('/api/analytics/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'funnel' }),
      });
      const result = await response.json();

      if (result.success) {
        setFunnelData(result.data);
      }
    } catch (error) {
      console.error('Error loading funnel data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSalesData(), loadFunnelData()]);
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

  if (!salesData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sales data available</p>
      </div>
    );
  }

  // Prepare chart data
  const vehicleTypeData = Object.entries(salesData.breakdown.byVehicleType).map(([type, data]) => ({
    name: type,
    revenue: data.revenue / 100,
    units: data.units,
  }));

  const brandData = Object.entries(salesData.breakdown.byBrand).map(([brand, data]) => ({
    name: brand,
    revenue: data.revenue / 100,
    units: data.units,
    profit: data.profit / 100,
  }));

  const salesPersonData = Object.entries(salesData.breakdown.bySalesPerson).map(([id, data]) => ({
    name: data.name,
    revenue: data.revenue / 100,
    units: data.units,
    commission: data.commission / 100,
  })).sort((a, b) => b.revenue - a.revenue);

  const trendData = salesData.trends.monthly.map(item => ({
    period: item.period,
    revenue: item.revenue / 100,
    units: item.units,
    profit: item.profit / 100,
    avgDealSize: item.avgDealSize / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(salesData.summary.totalRevenue / 100).toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {salesData.summary.revenueGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${salesData.summary.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {salesData.summary.revenueGrowth > 0 ? '+' : ''}{salesData.summary.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Units Sold</p>
                <p className="text-2xl font-bold text-gray-900">{salesData.summary.totalUnits}</p>
                <div className="flex items-center mt-1">
                  {salesData.summary.unitGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${salesData.summary.unitGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {salesData.summary.unitGrowth > 0 ? '+' : ''}{salesData.summary.unitGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Deal Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{Math.round(salesData.summary.avgDealSize / 100).toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {salesData.summary.dealSizeGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${salesData.summary.dealSizeGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {salesData.summary.dealSizeGrowth > 0 ? '+' : ''}{salesData.summary.dealSizeGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `€${value.toLocaleString()}`} />
                  <Tooltip
                    formatter={(value: any, name) => [
                      `€${value.toLocaleString()}`,
                      name === 'revenue' ? 'Revenue' : 'Profit'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Vehicle Type */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Vehicle Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.units})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {vehicleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`€${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Brand */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `€${value.toLocaleString()}`} />
                  <Tooltip
                    formatter={(value: any, name) => [
                      `€${value.toLocaleString()}`,
                      name === 'revenue' ? 'Revenue' : 'Profit'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                  <Bar dataKey="profit" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesPersonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `€${value.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'revenue' ? `€${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : name === 'units' ? 'Units' : 'Commission'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel */}
      {funnelData && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Conversion Funnel (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-lg mb-2">
                  <Users className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold">{funnelData.inquiries}</p>
                <p className="text-sm text-gray-600">Inquiries</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-lg mb-2">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold">{funnelData.testDrives}</p>
                <p className="text-sm text-gray-600">Test Drives</p>
                <p className="text-xs text-green-600">
                  {funnelData.conversionRates.inquiryToTestDrive.toFixed(1)}% conversion
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-lg mb-2">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold">{funnelData.sales}</p>
                <p className="text-sm text-gray-600">Sales</p>
                <p className="text-xs text-purple-600">
                  {funnelData.conversionRates.testDriveToSale.toFixed(1)}% conversion
                </p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 p-4 rounded-lg mb-2">
                  <Target className="h-8 w-8 text-orange-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold">{funnelData.conversionRates.inquiryToSale.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Overall Rate</p>
                <p className="text-xs text-orange-600">Inquiry to Sale</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}