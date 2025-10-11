'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Target,
  Award,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Medal,
  Crown,
  Trophy,
  Zap,
} from 'lucide-react';

interface TeamData {
  summary: {
    totalMembers: number;
    totalTeamRevenue: number;
    avgRevenuePerMember: number;
    avgTargetAchievement: number;
  };
  members: Array<{
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
    territory: string;
    hireDate: string;
    commissionRate: number;
    manager: string;
    subordinates: string[];
    currentPeriod: {
      totalRevenue: number;
      unitsSold: number;
      totalProfit: number;
      totalCommission: number;
      avgDealSize: number;
      avgDaysToClosure: number;
      conversionRate: number;
      targetAchievement: number;
      target: number;
    };
    historical: any;
    vehicleTypes: Record<string, { count: number; revenue: number; profit: number }>;
    recentTransactions: Array<{
      id: string;
      vehicle: string;
      customer: string;
      salePrice: number;
      profit: number;
      commission: number;
      completedAt: string;
    }>;
  }>;
  rankings: {
    byRevenue: any[];
    byUnits: any[];
    byConversionRate: any[];
    byTargetAchievement: any[];
  };
  departments: Record<string, {
    members: number;
    totalRevenue: number;
    totalUnits: number;
    avgConversionRate: number;
    avgRevenuePerMember: number;
  }>;
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
}

interface TeamDashboardProps {
  period: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const ROLE_COLORS = {
  SALES_ASSOCIATE: '#3B82F6',
  SENIOR_SALES_ASSOCIATE: '#10B981',
  SALES_MANAGER: '#F59E0B',
  GENERAL_MANAGER: '#EF4444',
  FINANCE_MANAGER: '#8B5CF6',
};

export default function TeamDashboard({ period }: TeamDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');


  // Load team data
  const loadTeamData = async () => {
    try {
      const response = await fetch(`/api/analytics/team?period=monthly`);
      const result = await response.json();

      if (result.success) {
        setTeamData(result.data);
      } else {
        toast.error('Failed to load team data');
      }
    } catch (error) {
      logger.error('Error loading team data:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to load team analytics');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadTeamData();
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

  if (!teamData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No team data available</p>
      </div>
    );
  }

  // Prepare chart data
  const memberPerformanceData = teamData.members.map(member => ({
    name: member.name.split(' ')[0], // First name only for chart
    revenue: member.currentPeriod.totalRevenue / 100,
    units: member.currentPeriod.unitsSold,
    conversionRate: member.currentPeriod.conversionRate,
    targetAchievement: member.currentPeriod.targetAchievement,
    avgDealSize: member.currentPeriod.avgDealSize / 100,
    commission: member.currentPeriod.totalCommission / 100,
  }));

  const departmentData = Object.entries(teamData.departments).map(([dept, data]) => ({
    name: dept,
    members: data.members,
    revenue: data.totalRevenue / 100,
    avgRevenue: data.avgRevenuePerMember / 100,
    conversionRate: data.avgConversionRate,
  }));

  // Get top performers
  const topPerformers = teamData.rankings.byRevenue.slice(0, 5);

  // Radar chart data for selected member
  const selectedMemberData = selectedMember !== 'all'
    ? teamData.members.find(m => m.id === selectedMember)
    : null;

  const radarData = selectedMemberData ? [
    { subject: 'Revenue', A: Math.min(selectedMemberData.currentPeriod.targetAchievement, 150), fullMark: 150 },
    { subject: 'Units', A: Math.min((selectedMemberData.currentPeriod.unitsSold / 10) * 100, 150), fullMark: 150 },
    { subject: 'Conversion', A: Math.min(selectedMemberData.currentPeriod.conversionRate * 5, 150), fullMark: 150 },
    { subject: 'Deal Size', A: Math.min((selectedMemberData.currentPeriod.avgDealSize / 30000) * 100, 150), fullMark: 150 },
    { subject: 'Speed', A: Math.min(120 - (selectedMemberData.currentPeriod.avgDaysToClosure / 30) * 100, 150), fullMark: 150 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamData.summary.totalMembers}</p>
                <p className="text-xs text-gray-500">Active sales staff</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Team Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(teamData.summary.totalTeamRevenue / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Current period</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Avg per Member</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(teamData.summary.avgRevenuePerMember / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Revenue per person</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Target Achievement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.summary.avgTargetAchievement.toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  {teamData.summary.avgTargetAchievement > 100 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-orange-500 mr-1" />
                  )}
                  <span className={`text-xs ${teamData.summary.avgTargetAchievement > 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    Team average
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
          >
            Detailed Analysis
          </Button>
        </div>
        {viewMode === 'detailed' && (
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Members</option>
            {teamData.members.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        )}
      </div>

      {viewMode === 'overview' ? (
        <>
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="text-center p-4 border rounded-lg">
                    <div className="flex justify-center mb-2">
                      {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
                      {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                      {index === 2 && <Medal className="h-6 w-6 text-amber-600" />}
                      {index > 2 && <Star className="h-6 w-6 text-blue-500" />}
                    </div>
                    <p className="font-medium text-sm">{performer.name}</p>
                    <p className="text-lg font-bold text-gray-900">
                      €{(performer.currentPeriod.totalRevenue / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{performer.currentPeriod.unitsSold} units</p>
                    <Badge
                      variant={performer.currentPeriod.targetAchievement > 100 ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {performer.currentPeriod.targetAchievement.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Member */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberPerformanceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `€${value.toLocaleString()}`} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip
                        formatter={(value: any, name) => [
                          name === 'revenue' ? `€${value.toLocaleString()}` :
                          name === 'commission' ? `€${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' :
                          name === 'commission' ? 'Commission' : 'Units'
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Target Achievement */}
            <Card>
              <CardHeader>
                <CardTitle>Target Achievement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name) => [
                          `${value.toFixed(1)}%`,
                          'Target Achievement'
                        ]}
                      />
                      <Bar
                        dataKey="targetAchievement"
                        fill="#10B981"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name) => [
                          name === 'revenue' || name === 'avgRevenue' ? `€${value.toLocaleString()}` :
                          name === 'conversionRate' ? `${value.toFixed(1)}%` : value,
                          name === 'revenue' ? 'Total Revenue' :
                          name === 'avgRevenue' ? 'Avg Revenue' :
                          name === 'conversionRate' ? 'Conversion Rate' : 'Members'
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Total Revenue" />
                      <Bar dataKey="avgRevenue" fill="#10B981" name="Avg Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memberPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                      />
                      <Line
                        type="monotone"
                        dataKey="conversionRate"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Detailed Analysis */}
          {selectedMemberData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedMemberData.name} - Performance Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 150]} />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Types Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Vehicle Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(selectedMemberData.vehicleTypes).map(([type, data]) => ({
                            name: type,
                            value: data.count,
                            revenue: data.revenue / 100,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name} (${entry.value})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(selectedMemberData.vehicleTypes).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name, props) => [
                            name === 'value' ? `${value} units` : `€${value.toLocaleString()}`,
                            name === 'value' ? 'Units Sold' : 'Revenue'
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Transactions */}
          {selectedMemberData && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Vehicle</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Sale Price</th>
                        <th className="text-left p-2">Profit</th>
                        <th className="text-left p-2">Commission</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMemberData.recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <p className="font-medium">{transaction.vehicle}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-sm">{transaction.customer}</p>
                          </td>
                          <td className="p-2">
                            <p className="font-medium">€{(transaction.salePrice / 100).toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-green-600">€{(transaction.profit / 100).toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-blue-600">€{(transaction.commission / 100).toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.completedAt).toLocaleDateString()}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Member</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Units</th>
                  <th className="text-left p-2">Conversion</th>
                  <th className="text-left p-2">Target</th>
                  <th className="text-left p-2">Commission</th>
                </tr>
              </thead>
              <tbody>
                {teamData.members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        style={{
                          backgroundColor: ROLE_COLORS[member.role as keyof typeof ROLE_COLORS],
                          color: 'white'
                        }}
                      >
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">€{(member.currentPeriod.totalRevenue / 100).toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{member.currentPeriod.unitsSold}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{member.currentPeriod.conversionRate.toFixed(1)}%</p>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <p className="font-medium mr-2">{member.currentPeriod.targetAchievement.toFixed(1)}%</p>
                        {member.currentPeriod.targetAchievement > 100 ? (
                          <Zap className="h-4 w-4 text-green-500" />
                        ) : member.currentPeriod.targetAchievement > 80 ? (
                          <TrendingUp className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="text-green-600">€{(member.currentPeriod.totalCommission / 100).toLocaleString()}</p>
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