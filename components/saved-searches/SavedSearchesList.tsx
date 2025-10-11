'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Bookmark,
  Search,
  Clock,
  Bell,
  BellOff,
  Trash2,
  MoreVertical,
  Star,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { updateSearchURL } from '@/lib/urlParams';
import { useSavedSearchStore } from '@/store/savedSearchStore';

interface SavedSearch {
  id: string;
  name: string;
  query?: string;
  filters: any;
  sortBy?: string;
  notifyOnNew: boolean;
  frequency?: string;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface SavedSearchesListProps {
  children?: React.ReactNode;
}

export default function SavedSearchesList({ children }: SavedSearchesListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchToDelete, setSearchToDelete] = useState<SavedSearch | null>(null);

  const queryClient = useQueryClient();
  const savedSearchStore = useSavedSearchStore();

  const sessionId = typeof window !== 'undefined'
    ? localStorage.getItem('sessionId') || ''
    : '';

  const { data: savedSearches = [], isLoading } = useQuery<SavedSearch[]>({
    queryKey: ['savedSearches', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const response = await fetch(`/api/saved-searches?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch saved searches');

      const data = await response.json();
      return data.savedSearches || [];
    },
    enabled: !!sessionId
  });

  const useSearchMutation = useMutation({
    mutationFn: async (searchId: string) => {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to track search usage');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    }
  });

  const deleteSearchMutation = useMutation({
    mutationFn: async (searchId: string) => {
      const response = await fetch(`/api/saved-searches?id=${searchId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete search');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search deleted successfully');
      setDeleteDialogOpen(false);
      setSearchToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const toggleNotificationsMutation = useMutation({
    mutationFn: async ({ searchId, notifyOnNew }: { searchId: string; notifyOnNew: boolean }) => {
      const response = await fetch('/api/saved-searches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: searchId, notifyOnNew })
      });
      if (!response.ok) throw new Error('Failed to update notifications');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Notification settings updated');
    }
  });

  const handleUseSearch = (search: SavedSearch) => {
    // Track usage
    useSearchMutation.mutate(search.id);

    // Apply the search filters
    const searchParams = {
      q: search.query,
      ...search.filters,
      sortBy: search.sortBy
    };

    updateSearchURL(searchParams);
    setIsOpen(false);
  };

  const handleDeleteSearch = (search: SavedSearch) => {
    setSearchToDelete(search);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (searchToDelete) {
      deleteSearchMutation.mutate(searchToDelete.id);
    }
  };

  const getSearchDescription = (search: SavedSearch) => {
    const parts: string[] = [];

    if (search.query) parts.push(`&quot;${search.query}&quot;`);
    if (search.filters.make) parts.push(search.filters.make);
    if (search.filters.bodyType) parts.push(search.filters.bodyType);

    if (search.filters.priceMin || search.filters.priceMax) {
      const priceRange = search.filters.priceMin && search.filters.priceMax
        ? `$${(search.filters.priceMin / 1000).toFixed(0)}k-$${(search.filters.priceMax / 1000).toFixed(0)}k`
        : search.filters.priceMin
        ? `From $${(search.filters.priceMin / 1000).toFixed(0)}k`
        : `Up to $${(search.filters.priceMax / 1000).toFixed(0)}k`;
      parts.push(priceRange);
    }

    return parts.length > 0 ? parts.join(' • ') : 'All vehicles';
  };

  const quickAccessSearches = savedSearchStore.getQuickAccessSearches();
  const recentSearches = savedSearches
    .filter(s => s.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
    .slice(0, 3);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Searches
              {savedSearches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {savedSearches.length}
                </Badge>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Searches ({savedSearches.length}/20)
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Quick Access */}
            {quickAccessSearches.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Quick Access
                </h3>
                <div className="space-y-2">
                  {quickAccessSearches.map((search) => {
                    const fullSearch = savedSearches.find(s => s.id === search.id);
                    if (!fullSearch) return null;

                    return (
                      <SearchItem
                        key={search.id}
                        search={fullSearch}
                        onUse={handleUseSearch}
                        onDelete={handleDeleteSearch}
                        onToggleNotifications={(searchId, enabled) =>
                          toggleNotificationsMutation.mutate({ searchId, notifyOnNew: enabled })
                        }
                        isQuickAccess
                      />
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recently Used
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((search) => (
                    <SearchItem
                      key={search.id}
                      search={search}
                      onUse={handleUseSearch}
                      onDelete={handleDeleteSearch}
                      onToggleNotifications={(searchId, enabled) =>
                        toggleNotificationsMutation.mutate({ searchId, notifyOnNew: enabled })
                      }
                    />
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* All Searches */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Search className="h-4 w-4" />
                All Searches
              </h3>

              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : savedSearches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bookmark className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No saved searches yet</p>
                  <p className="text-xs text-gray-400">Save a search to quickly access it later</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <SearchItem
                      key={search.id}
                      search={search}
                      onUse={handleUseSearch}
                      onDelete={handleDeleteSearch}
                      onToggleNotifications={(searchId, enabled) =>
                        toggleNotificationsMutation.mutate({ searchId, notifyOnNew: enabled })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Search</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{searchToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface SearchItemProps {
  search: SavedSearch;
  onUse: (search: SavedSearch) => void;
  onDelete: (search: SavedSearch) => void;
  onToggleNotifications: (searchId: string, enabled: boolean) => void;
  isQuickAccess?: boolean;
}

function SearchItem({
  search,
  onUse,
  onDelete,
  onToggleNotifications,
  isQuickAccess = false
}: SearchItemProps) {
  const getSearchDescription = (search: SavedSearch) => {
    const parts: string[] = [];

    if (search.query) parts.push(`&quot;${search.query}&quot;`);
    if (search.filters.make) parts.push(search.filters.make);
    if (search.filters.bodyType) parts.push(search.filters.bodyType);

    return parts.length > 0 ? parts.join(' • ') : 'All vehicles';
  };

  return (
    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{search.name}</h4>
            {isQuickAccess && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
            {search.notifyOnNew && (
              <Bell className="h-3 w-3 text-blue-500" />
            )}
          </div>
          <p className="text-xs text-gray-600 truncate mb-2">
            {getSearchDescription(search)}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Used {search.useCount} times
            </span>
            {search.lastUsedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(search.lastUsedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUse(search)}
            className="h-8 px-2"
          >
            Use
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onToggleNotifications(search.id, !search.notifyOnNew)}
              >
                {search.notifyOnNew ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Disable Alerts
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Alerts
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(search)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}