'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellRing,
  X,
  Check,
  Info,
  Car,
  DollarSign,
  Calendar,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'inquiry' | 'vehicle' | 'sale' | 'system' | 'appointment';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const generateMockNotifications = useCallback(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        category: 'inquiry',
        title: 'New Vehicle Inquiry',
        message: 'John Smith inquired about Audi A4 2020',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionUrl: '/admin?tab=customers',
      },
      {
        id: '2',
        type: 'warning',
        category: 'vehicle',
        title: 'Low Inventory Alert',
        message: 'Only 3 vehicles available in SUV category',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        type: 'success',
        category: 'sale',
        title: 'High-Value Lead',
        message: 'New lead interested in BMW X5 (€45,000)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        actionUrl: '/admin?tab=customers',
      },
      {
        id: '4',
        type: 'info',
        category: 'appointment',
        title: 'Test Drive Scheduled',
        message: 'Maria Garcia scheduled for Mercedes C-Class tomorrow at 2 PM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: '5',
        type: 'info',
        category: 'system',
        title: 'Facebook Sync Complete',
        message: '15 vehicles successfully synced from Facebook',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      logger.error('Error loading notifications:', { error: error instanceof Error ? error.message : String(error) });
      // Use mock data for development
      generateMockNotifications();
    }
  }, [generateMockNotifications]);

  useEffect(() => {
    // Initial load
    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      logger.error('Error marking notification as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      logger.error('Error marking all as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      logger.error('Error deleting notification:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'inquiry':
        return <Mail className="w-5 h-5" />;
      case 'vehicle':
        return <Car className="w-5 h-5" />;
      case 'sale':
        return <DollarSign className="w-5 h-5" />;
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'system':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-orange-600" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {notification.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2 text-blue-600"
                            onClick={() => {
                              window.location.href = notification.actionUrl!;
                              markAsRead(notification.id);
                            }}
                          >
                            View details →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t text-center">
            <Button variant="link" size="sm" className="text-blue-600">
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}