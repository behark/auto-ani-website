'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Users,
  TrendingUp,
  Star,
  Activity,
  Download,
  Search,
  Mail,
  Phone,
  DollarSign,
} from 'lucide-react';

interface CustomerData {
  leadScoring: Array<{
    email: string;
    name: string;
    inquiries: number;
    lastActivity: Date;
    score: number;
    avgVehiclePrice: number;
  }>;
  customerAcquisition: Array<{
    date: string;
    inquiries: number;
    contacts: number;
    total: number;
  }>;
  priceRangePreferences: Array<{
    range: string;
    count: number;
  }>;
  totalCustomers: number;
  avgInquiriesPerCustomer: number;
  hotLeads: number;
}

export default function CustomerBehaviorDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<CustomerData | null>(null);

  useEffect(() => {
    loadCustomerData();
  }, [timeRange]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?type=customer&range=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      logger.error('Error loading customer data:', { error: error instanceof Error ? error.message : String(error) });
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

  const getLeadTemperature = (score: number) => {
    if (score >= 70) return { label: 'Hot', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' };
    if (score >= 40) return { label: 'Warm', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
    return { label: 'Cold', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
  };

  const filteredLeads = data?.leadScoring.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Behavior Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Lead scoring, customer insights, and acquisition trends
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
          <Button variant="outline" size="sm">
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
              <span className="text-sm text-gray-600">Total Customers</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.totalCustomers}</div>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+15.3% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Hot Leads</span>
              <Star className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.hotLeads}</div>
            <p className="text-xs text-gray-600 mt-2">Score 70+</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Inquiries</span>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.avgInquiriesPerCustomer.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 mt-2">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">67.8%</div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8.2% vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Acquisition Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition Trends</CardTitle>
          <CardDescription>New customers and inquiries over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.customerAcquisition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="inquiries"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Inquiries"
              />
              <Area
                type="monotone"
                dataKey="contacts"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Contacts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Price Range Preferences and Lead Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Range Preferences</CardTitle>
            <CardDescription>Customer budget distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.priceRangePreferences}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.priceRangePreferences.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Temperature Distribution</CardTitle>
            <CardDescription>Lead quality breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Hot Leads</div>
                    <div className="text-sm text-gray-600">Score 70-100</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">{data.hotLeads}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-orange-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Warm Leads</div>
                    <div className="text-sm text-gray-600">Score 40-69</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.leadScoring.filter((l) => l.score >= 40 && l.score < 70).length}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Cold Leads</div>
                    <div className="text-sm text-gray-600">Score 0-39</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.leadScoring.filter((l) => l.score < 40).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Scoring Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lead Scoring Dashboard</CardTitle>
              <CardDescription>Prioritized customer leads based on engagement</CardDescription>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Temperature</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Inquiries</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Vehicle Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Last Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.slice(0, 15).map((lead, index) => {
                  const temp = getLeadTemperature(lead.score);
                  const daysSinceActivity = Math.floor(
                    (Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {lead.score}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${temp.bgColor} ${temp.textColor} border-0`}>
                          {temp.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{lead.inquiries} inquiries</Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {formatCurrency(lead.avgVehiclePrice)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {daysSinceActivity === 0
                          ? 'Today'
                          : daysSinceActivity === 1
                          ? 'Yesterday'
                          : `${daysSinceActivity} days ago`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}