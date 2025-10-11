'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  Eye,
  Download,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

// Import specialized dashboard components
import SalesDashboard from './analytics/SalesDashboard';
import InventoryDashboard from './analytics/InventoryDashboard';
import CustomerDashboard from './analytics/CustomerDashboard';
import TeamDashboard from './analytics/TeamDashboard';
import MarketDashboard from './analytics/MarketDashboard';

interface OverviewData {
  kpis: {
    totalRevenue: number;
    revenueGrowth: number;
    totalCustomers: number;
    customerGrowth: number;
    inventoryValue: number;
    avgDaysOnLot: number;
    conversionRate: number;
    teamPerformance: number;
  };
  sales?: {
    totalSales: number;
    avgOrderValue: number;
  };
  inventory?: {
    totalVehicles: number;
    lowStockCount: number;
  };
  customers?: {
    newCustomers: number;
    activeCustomers: number;
  };
  market?: {
    avgPricePosition: number;
    marketShare: number;
  };
  team?: {
    avgTargetAchievement: number;
    activeTeamMembers: number;
  };
  search?: {
    totalSearches: number;
    popularSearches: string[];
  };
  leads?: {
    totalInquiries: number;
    conversionRate: number;
  };
  appointments?: {
    totalAppointments: number;
    testDrives: number;
  };
}

interface EnhancedAnalyticsDashboardProps {
  className?: string;
}

export default function EnhancedAnalyticsDashboard({ className }: EnhancedAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

  // Real-time analytics disabled (socket removed for memory optimization)

  // Load overview data
  const loadOverviewData = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/overview?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setOverviewData(result.data);
      } else {
        toast.error('Failed to load analytics overview');
      }
    } catch (error) {
      logger.error('Error loading analytics overview:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to load analytics data');
    }
  }, [period]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadOverviewData();
      setLoading(false);
    };

    loadInitialData();
  }, [period, loadOverviewData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  // Real-time KPI updates disabled (socket removed for memory optimization)

  // Export functionality
  const handleExportData = async (type: string) => {
    try {
      const response = await fetch(`/api/analytics/export?type=${type}&period=${period}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`${type} analytics exported successfully`);
    } catch (error) {
      logger.error('Export error:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to export data');
    }
  };

  // Render KPI cards
  const renderKPICards = () => {
    if (!overviewData) return null;

    const kpis = [
      {
        title: 'Total Revenue',
        value: `€${(overviewData.kpis.totalRevenue / 100).toLocaleString()}`,
        change: overviewData.kpis.revenueGrowth,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        title: 'Total Customers',
        value: overviewData.kpis.totalCustomers.toLocaleString(),
        change: overviewData.kpis.customerGrowth,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Inventory Value',
        value: `€${(overviewData.kpis.inventoryValue / 100).toLocaleString()}`,
        change: null,
        icon: Car,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Avg Days on Lot',
        value: overviewData.kpis.avgDaysOnLot.toString(),
        change: null,
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'Conversion Rate',
        value: `${overviewData.kpis.conversionRate.toFixed(1)}%`,
        change: null,
        icon: Target,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
      },
      {
        title: 'Team Performance',
        value: `${overviewData.kpis.teamPerformance.toFixed(1)}%`,
        change: null,
        icon: CheckCircle,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  {kpi.change !== null && (
                    <div className="flex items-center mt-1">
                      {kpi.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          {/* Period selector */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-w-[100px]"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportData('overview')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Connection status */}
          <div className="flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-2 bg-gray-500"
            />
            <span className="text-xs text-gray-500">
              Real-time Disabled
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <Car className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {overviewData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick insights cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">New leads today</span>
                      <span className="font-semibold">{overviewData.leads?.totalInquiries || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Appointments scheduled</span>
                      <span className="font-semibold">{overviewData.appointments?.totalAppointments || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Test drives completed</span>
                      <span className="font-semibold">{overviewData.appointments?.testDrives || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Search sessions</span>
                      <span className="font-semibold">{overviewData.search?.totalSearches || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sales target achievement</span>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">
                          {overviewData.team?.avgTargetAchievement?.toFixed(1) || 0}%
                        </span>
                        {(overviewData.team?.avgTargetAchievement || 0) > 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Lead conversion rate</span>
                      <span className="font-semibold">{overviewData.leads?.conversionRate?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Customer satisfaction</span>
                      <span className="font-semibold">4.2/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Market competitiveness</span>
                      <span className="font-semibold">
                        {overviewData.market?.avgPricePosition?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Specialized Dashboard Tabs */}
        <TabsContent value="sales">
          <SalesDashboard period={period} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryDashboard period={period} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerDashboard period={period} />
        </TabsContent>

        <TabsContent value="team">
          <TeamDashboard period={period} />
        </TabsContent>

        <TabsContent value="market">
          <MarketDashboard period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
}