'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
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
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Download,
} from 'lucide-react';

interface AnalyticsData {
  salesData: Array<{ month: string; sales: number; revenue: number }>;
  vehicleViews: Array<{ name: string; views: number; inquiries: number }>;
  customerSegments: Array<{ name: string; value: number; color: string }>;
  performanceMetrics: {
    conversionRate: number;
    avgTimeOnSite: number;
    bounceRate: number;
    leadConversion: number;
  };
  revenueGrowth: number;
  topPerformingVehicles: Array<{ model: string; sales: number; revenue: number }>;
}

interface AnalyticsDashboardProps {
  detailed?: boolean;
}

export default function AnalyticsDashboard({ detailed = false }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        // Mock data for development
        setData({
          salesData: [
            { month: 'Jan', sales: 12, revenue: 245000 },
            { month: 'Feb', sales: 19, revenue: 380000 },
            { month: 'Mar', sales: 15, revenue: 290000 },
            { month: 'Apr', sales: 22, revenue: 440000 },
            { month: 'May', sales: 18, revenue: 350000 },
            { month: 'Jun', sales: 25, revenue: 500000 },
          ],
          vehicleViews: [
            { name: 'Audi A4', views: 1250, inquiries: 45 },
            { name: 'BMW 320d', views: 980, inquiries: 32 },
            { name: 'VW Golf', views: 850, inquiries: 28 },
            { name: 'Mercedes C220', views: 720, inquiries: 25 },
            { name: 'Skoda Superb', views: 650, inquiries: 22 },
          ],
          customerSegments: [
            { name: 'New Customers', value: 35, color: '#3B82F6' },
            { name: 'Returning Customers', value: 45, color: '#10B981' },
            { name: 'VIP Customers', value: 20, color: '#F59E0B' },
          ],
          performanceMetrics: {
            conversionRate: 3.2,
            avgTimeOnSite: 4.5,
            bounceRate: 35.8,
            leadConversion: 12.5,
          },
          revenueGrowth: 15.6,
          topPerformingVehicles: [
            { model: 'Audi A4 S-Line', sales: 5, revenue: 125000 },
            { model: 'BMW 320d', sales: 4, revenue: 110000 },
            { model: 'VW Golf GTD', sales: 3, revenue: 75000 },
          ],
        });
      }
    } catch (error) {
      logger.error('Error loading analytics:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || !data) {
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
        <h2 className="text-2xl font-bold">
          {detailed ? 'Detailed Analytics' : 'Analytics Overview'}
        </h2>
        <div className="flex items-center space-x-2">
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
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.conversionRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+0.8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Time on Site</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.avgTimeOnSite}m</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.bounceRate}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">-2.3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lead Conversion</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.leadConversion}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+3.2% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales & Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : 'Sales'
                  ]}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Bar yAxisId="left" dataKey="sales" fill="#10B981" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.vehicleViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#3B82F6" name="Views" />
                <Bar dataKey="inquiries" fill="#10B981" name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformingVehicles.map((vehicle, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{vehicle.model}</p>
                    <p className="text-sm text-gray-600">{vehicle.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(vehicle.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {detailed && (
        <div className="grid grid-cols-1 gap-6">
          {/* Additional detailed charts would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    +{data.revenueGrowth}%
                  </div>
                  <p className="text-gray-600">Revenue Growth (YoY)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}