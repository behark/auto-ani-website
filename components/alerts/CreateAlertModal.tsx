'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Clock, DollarSign, Calendar } from 'lucide-react';
import { SearchURLParams } from '@/lib/urlParams';
import { useAlertStore } from '@/store/alertStore';

interface CreateAlertModalProps {
  searchParams: Partial<SearchURLParams>;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function CreateAlertModal({
  searchParams,
  children,
  disabled = false
}: CreateAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [email, setEmail] = useState('');
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState<'INSTANT' | 'DAILY' | 'WEEKLY'>('DAILY');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minYear, setMinYear] = useState<string>('');

  const queryClient = useQueryClient();
  const alertStore = useAlertStore();

  const createAlertMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      filters: any;
      keywords?: string;
      frequency: string;
      maxPrice?: number;
      minYear?: number;
      sessionId: string;
    }) => {
      const response = await fetch('/api/inventory-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create alert');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update Zustand store
      alertStore.addAlert({
        name: alertName,
        email,
        filters: searchParams,
        frequency: frequency as any,
        isActive: true
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });

      toast.success('Alert created successfully! You&apos;ll be notified when matching vehicles are available.');
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setAlertName('');
    setEmail('');
    setKeywords('');
    setFrequency('DAILY');
    setMaxPrice('');
    setMinYear('');
  };

  const handleCreate = () => {
    if (!alertName.trim()) {
      toast.error('Please enter an alert name');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!alertStore.canCreateMore()) {
      toast.error('Maximum alerts reached (10)');
      return;
    }

    const sessionId = localStorage.getItem('sessionId') ||
      (() => {
        const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', id);
        return id;
      })();

    createAlertMutation.mutate({
      name: alertName.trim(),
      email: email.trim(),
      filters: searchParams,
      keywords: keywords.trim() || undefined,
      frequency,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      minYear: minYear ? parseInt(minYear) : undefined,
      sessionId
    });
  };

  const getSearchDescription = () => {
    const parts: string[] = [];

    if (searchParams.q) parts.push(`"${searchParams.q}"`);
    if (searchParams.make) parts.push(searchParams.make);
    if (searchParams.bodyType) parts.push(searchParams.bodyType);
    if (searchParams.priceMin || searchParams.priceMax) {
      const priceRange = searchParams.priceMin && searchParams.priceMax
        ? `$${(searchParams.priceMin / 1000).toFixed(0)}k - $${(searchParams.priceMax / 1000).toFixed(0)}k`
        : searchParams.priceMin
        ? `From $${(searchParams.priceMin / 1000).toFixed(0)}k`
        : `Up to $${(searchParams.priceMax! / 1000).toFixed(0)}k`;
      parts.push(priceRange);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Any vehicle';
  };

  const hasActiveFilters = Object.keys(searchParams).some(key =>
    searchParams[key as keyof SearchURLParams] !== undefined
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Bell className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Inventory Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current search preview */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">Alert criteria based on current search:</p>
            <p className="font-medium text-sm text-blue-900">{getSearchDescription()}</p>
            {!hasActiveFilters && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Apply filters in your search to create more specific alerts
              </p>
            )}
          </div>

          {/* Alert name */}
          <div className="space-y-2">
            <Label htmlFor="alert-name">Alert Name *</Label>
            <Input
              id="alert-name"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g., BMW SUVs under $30k"
              maxLength={100}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="alert-email">Email Address *</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1"
              />
            </div>
          </div>

          {/* Additional keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Additional Keywords (Optional)</Label>
            <Textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="leather seats, navigation, low miles"
              className="min-h-[60px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              Add specific features or requirements you're looking for
            </p>
          </div>

          {/* Notification frequency */}
          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSTANT">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Instantly (when vehicles are added)</span>
                  </div>
                </SelectItem>
                <SelectItem value="DAILY">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Daily digest</span>
                  </div>
                </SelectItem>
                <SelectItem value="WEEKLY">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Weekly summary</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional constraints */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-price">Max Price (Optional)</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <Input
                  id="max-price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="50000"
                  min="0"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-year">Min Year (Optional)</Label>
              <Input
                id="min-year"
                type="number"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                placeholder="2020"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Alert info */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <h4 className="font-medium mb-1">How alerts work:</h4>
            <ul className="text-xs space-y-1">
              <li>• You&apos;ll be notified when vehicles matching your criteria become available</li>
              <li>• Manage your alerts from your dashboard</li>
              <li>• You can have up to 10 active alerts</li>
              <li>• Unsubscribe anytime from the notification emails</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createAlertMutation.isPending || !alertName.trim() || !email.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}