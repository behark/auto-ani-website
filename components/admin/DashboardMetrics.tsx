'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Package,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalReservations: number;
  pendingAppointments: number;
  totalRevenue: number;
  monthlyGrowth: number;
  lowStockAlerts: number;
  activePromotions: number;
  totalParts: number;
  cartAbandonmentRate: number;
  averageOrderValue: number;
  totalCustomers: number;
}

interface DashboardMetricsProps {
  stats: DashboardStats;
}

export default function DashboardMetrics({ stats }: DashboardMetricsProps) {
  const { t } = useTranslation('admin');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: t('metrics.vehicles', 'Total Vehicles'),
      value: stats.totalVehicles,
      subtitle: `${stats.availableVehicles} ${t('metrics.available', 'available')}`,
      icon: Car,
      color: 'blue',
      trend: null,
    },
    {
      title: t('metrics.revenue', 'Total Revenue'),
      value: formatCurrency(stats.totalRevenue),
      subtitle: t('metrics.thisMonth', 'This month'),
      icon: DollarSign,
      color: 'green',
      trend: stats.monthlyGrowth,
    },
    {
      title: t('metrics.reservations', 'Reservations'),
      value: stats.totalReservations,
      subtitle: t('metrics.active', 'Active'),
      icon: ShoppingCart,
      color: 'purple',
      trend: null,
    },
    {
      title: t('metrics.appointments', 'Appointments'),
      value: stats.pendingAppointments,
      subtitle: t('metrics.pending', 'Pending'),
      icon: Calendar,
      color: 'orange',
      trend: null,
    },
    {
      title: t('metrics.customers', 'Customers'),
      value: stats.totalCustomers,
      subtitle: t('metrics.registered', 'Registered'),
      icon: Users,
      color: 'indigo',
      trend: null,
    },
    {
      title: t('metrics.parts', 'Parts Inventory'),
      value: stats.totalParts,
      subtitle: `${stats.lowStockAlerts} ${t('metrics.lowStock', 'low stock')}`,
      icon: Package,
      color: stats.lowStockAlerts > 0 ? 'red' : 'gray',
      trend: null,
      alert: stats.lowStockAlerts > 0,
    },
    {
      title: t('metrics.avgOrder', 'Avg Order Value'),
      value: formatCurrency(stats.averageOrderValue),
      subtitle: t('metrics.lastWeek', 'Last 7 days'),
      icon: TrendingUp,
      color: 'teal',
      trend: null,
    },
    {
      title: t('metrics.promotions', 'Active Promotions'),
      value: stats.activePromotions,
      subtitle: t('metrics.running', 'Running'),
      icon: AlertTriangle,
      color: 'yellow',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                <IconComponent className={`h-4 w-4 text-${metric.color}-600`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
                {metric.alert && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Alert
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-600">
                  {metric.subtitle}
                </p>
                {metric.trend !== null && (
                  <div className={`flex items-center text-xs ${
                    metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(metric.trend)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}