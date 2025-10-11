'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Download, Filter } from 'lucide-react';

interface SalesData {
  conversionFunnel: Array<{
    date: string;
    leads: number;
    inquiries: number;
    testDrives: number;
    sales: number;
  }>;
  salesByType: Array<{ type: string; count: number; revenue: number }>;
  revenueByMake: Array<{ make: string; revenue: number; count: number }>;
  totalRevenue: number;
  totalInquiries: number;
  avgDealSize: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AdvancedSalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<SalesData | null>(null);

  useEffect(() => {
    loadSalesData();
  }, [timeRange]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?type=sales&range=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      logger.error('Error loading sales data:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportData = () => {
    // TODO: Implement export functionality
    logger.debug('Exporting sales data...');
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // Calculate conversion rates
  const totalLeads = data.conversionFunnel.reduce((sum, d) => sum + d.leads, 0);
  const totalInquiries = data.conversionFunnel.reduce((sum, d) => sum + d.inquiries, 0);
  const totalTestDrives = data.conversionFunnel.reduce((sum, d) => sum + d.testDrives, 0);
  const totalSales = data.conversionFunnel.reduce((sum, d) => sum + d.sales, 0);

  const inquiryConversion = totalLeads > 0 ? (totalInquiries / totalLeads) * 100 : 0;
  const testDriveConversion = totalInquiries > 0 ? (totalTestDrives / totalInquiries) * 100 : 0;
  const salesConversion = totalTestDrives > 0 ? (totalSales / totalTestDrives) * 100 : 0;
  const overallConversion = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track sales performance and conversion metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalRevenue)}
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12.5% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Inquiries</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.totalInquiries}
            </div>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8.3% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Deal Size</span>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.avgDealSize)}
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+5.2% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <Filter className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {overallConversion.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+2.1% vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Conversion Funnel</CardTitle>
          <CardDescription>Track how leads progress through your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="inquiries"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Inquiries"
                  />
                  <Area
                    type="monotone"
                    dataKey="testDrives"
                    stackId="3"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Test Drives"
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stackId="4"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Sales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Leads → Inquiries</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {inquiryConversion.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(inquiryConversion, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Inquiries → Test Drives</span>
                  <span className="text-2xl font-bold text-green-600">
                    {testDriveConversion.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(testDriveConversion, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Test Drives → Sales</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {salesConversion.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${Math.min(salesConversion, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Overall Conversion</span>
                  <span className="text-2xl font-bold text-red-600">
                    {overallConversion.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${Math.min(overallConversion, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales by Type and Revenue by Make */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Vehicle Type</CardTitle>
            <CardDescription>Distribution of inquiries by fuel type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.salesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.salesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: string, props: any) => [
                    `${value} inquiries (${formatCurrency(props.payload.revenue)})`,
                    props.payload.type,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Make</CardTitle>
            <CardDescription>Top performing vehicle brands</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByMake} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="make" type="category" width={80} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Make: ${label}`}
                />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {data.revenueByMake.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{item.make}</span>
                    <span className="text-sm text-gray-600 ml-2">({item.count} inquiries)</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}