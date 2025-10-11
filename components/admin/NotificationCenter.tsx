'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Car,
  Package,
  Users,
  DollarSign,
  Calendar,
  Shield,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  category: 'VEHICLE' | 'ORDER' | 'CUSTOMER' | 'SYSTEM' | 'PAYMENT' | 'APPOINTMENT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
}

export default function NotificationCenter({ notifications }: NotificationCenterProps) {
  const { t } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      setLocalNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      logger.error('Error marking notification as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH',
      });

      setLocalNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      logger.error('Error marking all notifications as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      setLocalNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      logger.error('Error deleting notification:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'VEHICLE':
        return <Car className="w-4 h-4" />;
      case 'ORDER':
        return <Package className="w-4 h-4" />;
      case 'CUSTOMER':
        return <Users className="w-4 h-4" />;
      case 'PAYMENT':
        return <DollarSign className="w-4 h-4" />;
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4" />;
      case 'SYSTEM':
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-green-200 bg-green-50';
      case 'WARNING':
        return 'border-yellow-200 bg-yellow-50';
      case 'ERROR':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {t('notifications.title', 'Notifications')}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {localNotifications.length > 0 ? (
            localNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b last:border-b-0 transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg border ${getTypeColor(notification.type)}`}>
                      <div className="flex items-center space-x-1">
                        {getNotificationIcon(notification.category)}
                        {getTypeIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.actionUrl && notification.actionText && (
                          <Button variant="ghost" size="sm" className="text-xs h-6">
                            {notification.actionText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">
                You&apos;ll see important updates here
              </p>
            </div>
          )}
        </div>

        {localNotifications.length > 0 && (
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full text-sm">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}