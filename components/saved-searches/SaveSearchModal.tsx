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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Bell, Mail } from 'lucide-react';
import { SearchURLParams } from '@/lib/urlParams';
import { useSavedSearchStore } from '@/store/savedSearchStore';

interface SaveSearchModalProps {
  searchParams: Partial<SearchURLParams>;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function SaveSearchModal({
  searchParams,
  children,
  disabled = false
}: SaveSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [frequency, setFrequency] = useState<'INSTANT' | 'DAILY' | 'WEEKLY'>('DAILY');

  const queryClient = useQueryClient();
  const savedSearchStore = useSavedSearchStore();

  const saveSearchMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      query?: string;
      filters: any;
      sortBy?: string;
      notifyOnNew: boolean;
      frequency: string;
      email?: string;
      sessionId: string;
    }) => {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save search');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update Zustand store
      savedSearchStore.saveSearch({
        name: searchName,
        query: searchParams.q,
        filters: searchParams,
        sortBy: searchParams.sortBy,
        notifyOnNew: enableNotifications
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });

      toast.success('Search saved successfully!');
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setSearchName('');
    setEnableNotifications(false);
    setNotificationEmail('');
    setFrequency('DAILY');
  };

  const handleSave = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    if (!savedSearchStore.canSaveMore()) {
      toast.error('Maximum saved searches reached (20)');
      return;
    }

    const sessionId = localStorage.getItem('sessionId') ||
      (() => {
        const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', id);
        return id;
      })();

    saveSearchMutation.mutate({
      name: searchName.trim(),
      query: searchParams.q,
      filters: searchParams,
      sortBy: searchParams.sortBy,
      notifyOnNew: enableNotifications,
      frequency,
      email: enableNotifications ? notificationEmail : undefined,
      sessionId
    });
  };

  const getSearchDescription = () => {
    const parts: string[] = [];

    if (searchParams.q) parts.push(`&quot;${searchParams.q}&quot;`);
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
    if (searchParams.yearMin || searchParams.yearMax) {
      const yearRange = searchParams.yearMin && searchParams.yearMax
        ? `${searchParams.yearMin}-${searchParams.yearMax}`
        : searchParams.yearMin
        ? `${searchParams.yearMin}+`
        : `Up to ${searchParams.yearMax}`;
      parts.push(yearRange);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Current search';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">You&apos;re saving:</p>
            <p className="font-medium text-sm">{getSearchDescription()}</p>
          </div>

          {/* Search name */}
          <div className="space-y-2">
            <Label htmlFor="search-name">Search Name *</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., BMW SUVs under $30k"
              maxLength={100}
            />
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={(checked) => setEnableNotifications(checked as boolean)}
              />
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notify me when new vehicles match this search
              </Label>
            </div>

            {enableNotifications && (
              <div className="pl-6 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Email Address *</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="notification-email"
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notification Frequency</Label>
                  <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTANT">Instantly</SelectItem>
                      <SelectItem value="DAILY">Daily digest</SelectItem>
                      <SelectItem value="WEEKLY">Weekly summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
            onClick={handleSave}
            disabled={saveSearchMutation.isPending || !searchName.trim() ||
              (enableNotifications && !notificationEmail.trim())}
          >
            {saveSearchMutation.isPending ? 'Saving...' : 'Save Search'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}