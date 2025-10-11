'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Bell,
  BellOff,
  Edit,
  Trash2,
  Clock,
  Mail,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAlertStore } from '@/store/alertStore';

interface Alert {
  id: string;
  name: string;
  email: string;
  filters: any;
  keywords?: string;
  frequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
  maxPrice?: number;
  minYear?: number;
  isActive: boolean;
  matchCount: number;
  lastMatchedAt?: string;
  lastNotifiedAt?: string;
  createdAt: string;
  notifications?: AlertNotification[];
}

interface AlertNotification {
  id: string;
  sentAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  method: 'EMAIL';
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    images: string[];
  };
}

interface AlertsManagementDashboardProps {
  sessionId?: string;
  userId?: string;
  email?: string;
}

export default function AlertsManagementDashboard({
  sessionId,
  userId,
  email
}: AlertsManagementDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'INSTANT' | 'DAILY' | 'WEEKLY'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'matches' | 'name'>('newest');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const queryClient = useQueryClient();
  const alertStore = useAlertStore();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (sessionId) queryParams.append('sessionId', sessionId);
  if (userId) queryParams.append('userId', userId);
  if (email) queryParams.append('email', email);

  const { data: alertsData, isLoading, error } = useQuery({
    queryKey: ['inventoryAlerts', sessionId, userId, email],
    queryFn: async () => {
      const response = await fetch(`/api/inventory-alerts?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    enabled: !!(sessionId || userId || email)
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/inventory-alerts?id=${alertId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      toast.success('Alert deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      const response = await fetch('/api/inventory-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, isActive })
      });
      if (!response.ok) throw new Error('Failed to update alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      toast.success('Alert updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: async (updates: Partial<Alert> & { id: string }) => {
      const response = await fetch('/api/inventory-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      setEditingAlert(null);
      toast.success('Alert updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const alerts: Alert[] = alertsData?.alerts || [];

  // Filter and sort alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.keywords?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && alert.isActive) ||
                         (statusFilter === 'inactive' && !alert.isActive);
    const matchesFrequency = frequencyFilter === 'all' || alert.frequency === frequencyFilter;

    return matchesSearch && matchesStatus && matchesFrequency;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'matches':
        return b.matchCount - a.matchCount;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleDeleteAlert = (alertId: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      deleteAlertMutation.mutate(alertId);
    }
  };

  const handleToggleAlert = (alertId: string, currentStatus: boolean) => {
    toggleAlertMutation.mutate({ alertId, isActive: !currentStatus });
  };

  const getFilterDescription = (filters: any) => {
    const parts: string[] = [];
    if (filters.make) parts.push(filters.make);
    if (filters.bodyType) parts.push(filters.bodyType);
    if (filters.priceMin || filters.priceMax) {
      const priceRange = filters.priceMin && filters.priceMax
        ? `$${(filters.priceMin / 1000).toFixed(0)}k - $${(filters.priceMax / 1000).toFixed(0)}k`
        : filters.priceMin
        ? `From $${(filters.priceMin / 1000).toFixed(0)}k`
        : `Up to $${(filters.priceMax / 1000).toFixed(0)}k`;
      parts.push(priceRange);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Any vehicle';
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'INSTANT': return <Bell className="h-4 w-4" />;
      case 'DAILY': return <Clock className="h-4 w-4" />;
      case 'WEEKLY': return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!sessionId && !userId && !email) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please provide session ID, user ID, or email to view alerts.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600">Failed to load alerts. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Alerts</h2>
          <p className="text-gray-600">
            Manage your vehicle inventory alerts ({alerts.length} total, {alerts.filter(a => a.isActive).length} active)
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Alerts</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequencyFilter} onValueChange={(value: any) => setFrequencyFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="INSTANT">Instant</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="matches">Most Matches</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts found</h3>
            <p className="text-gray-600 mb-4">
              {alerts.length === 0
                ? "You haven't created any inventory alerts yet."
                : "No alerts match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.isActive ? '' : 'opacity-60'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getFrequencyIcon(alert.frequency)}
                        {alert.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{getFilterDescription(alert.filters)}</p>
                    {alert.keywords && (
                      <p className="text-sm text-blue-600">Keywords: {alert.keywords}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => handleToggleAlert(alert.id, alert.isActive)}
                      disabled={toggleAlertMutation.isPending}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAlert(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Matches Found</p>
                    <p className="text-lg font-semibold">{alert.matchCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="text-sm">{format(new Date(alert.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Match</p>
                    <p className="text-sm">
                      {alert.lastMatchedAt
                        ? formatDistanceToNow(new Date(alert.lastMatchedAt), { addSuffix: true })
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Notified</p>
                    <p className="text-sm">
                      {alert.lastNotifiedAt
                        ? formatDistanceToNow(new Date(alert.lastNotifiedAt), { addSuffix: true })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                {/* Recent Notifications */}
                {alert.notifications && alert.notifications.length > 0 && (
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                      className="flex items-center gap-2 mb-2"
                    >
                      Recent Notifications ({alert.notifications.length})
                      {expandedAlert === alert.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedAlert === alert.id && (
                      <div className="space-y-3">
                        {alert.notifications.map((notification) => (
                          <div key={notification.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(notification.status)}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {notification.vehicle.year} {notification.vehicle.make} {notification.vehicle.model}
                              </p>
                              <p className="text-xs text-gray-600">
                                ${notification.vehicle.price.toLocaleString()} • {format(new Date(notification.sentAt), 'MMM d, HH:mm')}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                notification.status === 'SENT' ? 'border-green-500 text-green-700' :
                                notification.status === 'PENDING' ? 'border-yellow-500 text-yellow-700' :
                                'border-red-500 text-red-700'
                              }`}
                            >
                              {notification.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Alert Modal */}
      {editingAlert && (
        <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Alert: {editingAlert.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Alert Name</Label>
                <Input
                  id="edit-name"
                  value={editingAlert.name}
                  onChange={(e) => setEditingAlert({ ...editingAlert, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-keywords">Keywords</Label>
                <Input
                  id="edit-keywords"
                  value={editingAlert.keywords || ''}
                  onChange={(e) => setEditingAlert({ ...editingAlert, keywords: e.target.value })}
                  placeholder="leather seats, navigation, low miles"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={editingAlert.frequency}
                  onValueChange={(value: any) => setEditingAlert({ ...editingAlert, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTANT">Instant</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-max-price">Max Price</Label>
                  <Input
                    id="edit-max-price"
                    type="number"
                    value={editingAlert.maxPrice || ''}
                    onChange={(e) => setEditingAlert({
                      ...editingAlert,
                      maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-min-year">Min Year</Label>
                  <Input
                    id="edit-min-year"
                    type="number"
                    value={editingAlert.minYear || ''}
                    onChange={(e) => setEditingAlert({
                      ...editingAlert,
                      minYear: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="2020"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAlert(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateAlertMutation.mutate(editingAlert)}
                disabled={updateAlertMutation.isPending}
              >
                {updateAlertMutation.isPending ? 'Updating...' : 'Update Alert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}