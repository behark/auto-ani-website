'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Car, Clock, TrendingUp, AlertTriangle, Download, Eye } from 'lucide-react';

interface InventoryData {
  inventoryByStatus: Array<{ status: string; count: number; value: number }>;
  daysInInventory: Array<{
    id: string;
    vehicle: string;
    days: number;
    status: string;
    price: number;
    inquiries: number;
  }>;
  mostInquired: Array<{
    vehicle: string;
    inquiries: number;
    price: number;
    year: number;
  }>;
  turnoverByMake: Array<{
    make: string;
    totalVehicles: number;
    avgDaysInInventory: number;
    inquiries: number;
  }>;
  totalInventoryValue: number;
  avgDaysInInventory: number;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',
  RESERVED: '#F59E0B',
  SOLD: '#3B82F6',
  PENDING: '#8B5CF6',
};

export default function VehicleInventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<InventoryData | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, [timeRange]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?type=inventory&range=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      logger.error('Error loading inventory data:', { error: error instanceof Error ? error.message : String(error) });
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

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const totalVehicles = data.inventoryByStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor vehicle performance and inventory turnover
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
              <span className="text-sm text-gray-600">Total Inventory</span>
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalVehicles}</div>
            <p className="text-xs text-gray-600 mt-2">
              {data.inventoryByStatus.find((s) => s.status === 'AVAILABLE')?.count || 0} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Inventory Value</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalInventoryValue)}
            </div>
            <p className="text-xs text-gray-600 mt-2">Total asset value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Days in Stock</span>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.avgDaysInInventory}</div>
            <p className="text-xs text-gray-600 mt-2">Inventory turnover time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Aging Inventory</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.daysInInventory.filter((v) => v.days > 60).length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Over 60 days in stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Status</CardTitle>
            <CardDescription>Current vehicle distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.inventoryByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.inventoryByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: string, props: any) => [
                    `${value} vehicles (${formatCurrency(props.payload.value)})`,
                    props.payload.status,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {data.inventoryByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }}
                    />
                    <span className="font-medium text-gray-900">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.count}</div>
                    <div className="text-xs text-gray-600">{formatCurrency(item.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover by Make</CardTitle>
            <CardDescription>Average days in inventory by brand</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.turnoverByMake.slice(0, 8)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="make" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="avgDaysInInventory" fill="#F59E0B" name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {data.turnoverByMake.slice(0, 4).map((item, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-900">{item.make}</div>
                  <div className="text-gray-600">
                    {item.totalVehicles} vehicles, {item.inquiries} inquiries
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Inquired Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Most Inquired Vehicles</CardTitle>
          <CardDescription>Top performing vehicles by customer interest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.mostInquired.map((vehicle, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{vehicle.vehicle}</div>
                    <div className="text-sm text-gray-600">Year: {vehicle.year}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center text-blue-600">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="font-bold">{vehicle.inquiries}</span>
                    </div>
                    <div className="text-xs text-gray-600">inquiries</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(vehicle.price)}</div>
                    <div className="text-xs text-gray-600">price</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aging Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Inventory Analysis</CardTitle>
          <CardDescription>Vehicles with longest time in inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Days in Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Inquiries</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.daysInInventory.slice(0, 10).map((vehicle, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{vehicle.vehicle}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={vehicle.days > 60 ? 'destructive' : vehicle.days > 30 ? 'default' : 'outline'}
                      >
                        {vehicle.days} days
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{vehicle.inquiries}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatCurrency(vehicle.price)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{vehicle.status}</Badge>
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