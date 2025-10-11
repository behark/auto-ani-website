'use client';

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
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Car,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface InventoryData {
  summary: {
    totalInventory: number;
    totalValue: number;
    avgDaysOnLot: number;
    turnoverRate: number;
  };
  aging: Record<string, { count: number; value: number }>;
  performance: {
    byMake: Record<string, any>;
    byPriceRange: Array<{ range: string; count: number; value: number; avgDaysOnLot: number }>;
  };
  vehicles: Array<{
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    price: number;
    costPrice: number;
    status: string;
    daysOnLot: number;
    viewCount: number;
    inquiryCount: number;
    testDriveCount: number;
    profitMargin: number;
    marketDemand: string;
    ageCategory: string;
    isSold: boolean;
    pricePosition: string;
    competitiveAdvantage: number;
    competitorCount: number;
  }>;
}

interface InventoryDashboardProps {
  period: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const AGE_CATEGORY_COLORS = {
  NEW_ARRIVAL: '#10B981',
  FRESH: '#3B82F6',
  AGING: '#F59E0B',
  STALE: '#EF4444',
  CRITICAL: '#DC2626',
};

const AGE_CATEGORY_LABELS = {
  NEW_ARRIVAL: '0-30 days',
  FRESH: '31-60 days',
  AGING: '61-120 days',
  STALE: '121-180 days',
  CRITICAL: '180+ days',
};

export default function InventoryDashboard({ period }: InventoryDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [selectedMake, setSelectedMake] = useState<string>('all');


  // Load inventory data
  const loadInventoryData = async () => {
    try {
      const response = await fetch('/api/analytics/inventory');
      const result = await response.json();

      if (result.success) {
        setInventoryData(result.data);
      } else {
        toast.error('Failed to load inventory data');
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory analytics');
    }
  };

  // Update inventory metrics
  const updateInventoryMetrics = async () => {
    setUpdating(true);
    try {
      const response = await fetch('/api/analytics/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulkUpdateMetrics' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Inventory metrics updated');
        await loadInventoryData();
      } else {
        toast.error('Failed to update metrics');
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast.error('Failed to update inventory metrics');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadInventoryData();
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

  if (!inventoryData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No inventory data available</p>
      </div>
    );
  }

  // Prepare chart data
  const agingData = Object.entries(inventoryData.aging).map(([category, data]) => ({
    name: AGE_CATEGORY_LABELS[category as keyof typeof AGE_CATEGORY_LABELS] || category,
    count: data.count,
    value: data.value / 100,
    color: AGE_CATEGORY_COLORS[category as keyof typeof AGE_CATEGORY_COLORS] || '#6B7280',
  }));

  const makePerformanceData = Object.entries(inventoryData.performance.byMake).map(([make, data]) => ({
    make,
    total: data.total,
    sold: data.sold,
    conversionRate: data.conversionRate,
    avgDaysOnLot: data.avgDaysOnLot,
    avgInquiries: data.avgInquiries,
    totalValue: data.totalValue / 100,
  }));

  const priceRangeData = inventoryData.performance.byPriceRange.map(item => ({
    range: item.range,
    count: item.count,
    value: item.value / 100,
    avgDaysOnLot: item.avgDaysOnLot,
  }));

  // Filter vehicles by selected make
  const filteredVehicles = selectedMake === 'all'
    ? inventoryData.vehicles
    : inventoryData.vehicles.filter(v => v.make === selectedMake);

  // Performance vs Aging scatter plot data
  const performanceScatterData = inventoryData.vehicles.map(vehicle => ({
    x: vehicle.daysOnLot,
    y: vehicle.inquiryCount,
    z: vehicle.price / 100,
    make: vehicle.make,
    model: vehicle.model,
    ageCategory: vehicle.ageCategory,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Inventory</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryData.summary.totalInventory}</p>
                <p className="text-xs text-gray-500">Active vehicles</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(inventoryData.summary.totalValue / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Current inventory</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Days on Lot</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryData.summary.avgDaysOnLot}</p>
                <p className="text-xs text-gray-500">All vehicles</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Turnover Rate</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryData.summary.turnoverRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Last 90 days</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={updateInventoryMetrics}
            disabled={updating}
            variant="outline"
          >
            {updating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Update Metrics
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'count' ? `${value} vehicles` : `€${value.toLocaleString()}`,
                      name === 'count' ? 'Count' : 'Value'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance by Make */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Make</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={makePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="make" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'conversionRate' ? `${value.toFixed(1)}%` : value,
                      name === 'conversionRate' ? 'Conversion Rate' :
                      name === 'avgDaysOnLot' ? 'Avg Days on Lot' : 'Total Vehicles'
                    ]}
                  />
                  <Bar dataKey="total" fill="#3B82F6" name="Total" />
                  <Bar dataKey="sold" fill="#10B981" name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Price Range Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Price Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name) => [
                      name === 'value' ? `€${value.toLocaleString()}` :
                      name === 'avgDaysOnLot' ? `${value} days` : `${value} vehicles`,
                      name === 'value' ? 'Total Value' :
                      name === 'avgDaysOnLot' ? 'Avg Days on Lot' : 'Count'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3B82F6" name="Count" />
                  <Bar dataKey="avgDaysOnLot" fill="#F59E0B" name="Avg Days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance vs Aging Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Performance vs Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={performanceScatterData}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Days on Lot" />
                  <YAxis type="number" dataKey="y" name="Inquiries" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-medium">{data.make} {data.model}</p>
                            <p>Days on Lot: {data.x}</p>
                            <p>Inquiries: {data.y}</p>
                            <p>Price: €{data.z.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="y" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Performance Details</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by make:</span>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Makes</option>
                {Array.from(new Set(inventoryData.vehicles.map(v => v.make))).map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vehicle</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Days on Lot</th>
                  <th className="text-left p-2">Views</th>
                  <th className="text-left p-2">Inquiries</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Age Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.slice(0, 20).map((vehicle) => (
                  <tr key={vehicle.vehicleId} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-500">{vehicle.year}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">€{(vehicle.price / 100).toLocaleString()}</p>
                      {vehicle.profitMargin > 0 && (
                        <p className="text-sm text-green-600">
                          {vehicle.profitMargin.toFixed(1)}% margin
                        </p>
                      )}
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{vehicle.daysOnLot}</p>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-gray-400 mr-1" />
                        {vehicle.viewCount}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 text-gray-400 mr-1" />
                        {vehicle.inquiryCount}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={vehicle.status === 'AVAILABLE' ? 'default' : 'secondary'}
                      >
                        {vehicle.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge
                        style={{
                          backgroundColor: AGE_CATEGORY_COLORS[vehicle.ageCategory as keyof typeof AGE_CATEGORY_COLORS],
                          color: 'white'
                        }}
                      >
                        {AGE_CATEGORY_LABELS[vehicle.ageCategory as keyof typeof AGE_CATEGORY_LABELS]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVehicles.length > 20 && (
              <div className="text-center py-4 text-gray-500">
                Showing 20 of {filteredVehicles.length} vehicles
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}