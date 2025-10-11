'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface NetworkStatusProps {
  showPermanent?: boolean;
  className?: string;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export default function NetworkStatus({ showPermanent = false, className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [offlineDuration, setOfflineDuration] = useState<string>('');

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        setLastOnlineTime(new Date());
        setShowOfflineAlert(true);
        startOfflineTimer();
      } else {
        setShowOfflineAlert(false);
        setOfflineDuration('');
      }
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      }
    };

    // Initial setup
    updateOnlineStatus();
    updateConnectionInfo();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Connection change listener
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  const startOfflineTimer = () => {
    const timer = setInterval(() => {
      if (lastOnlineTime) {
        const now = new Date();
        const diff = now.getTime() - lastOnlineTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes > 0) {
          setOfflineDuration(`${minutes}m ${seconds}s`);
        } else {
          setOfflineDuration(`${seconds}s`);
        }
      }

      if (navigator.onLine) {
        clearInterval(timer);
      }
    }, 1000);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowOfflineAlert(false);
  };

  const getConnectionQuality = () => {
    if (!connectionInfo) return null;

    const { effectiveType, downlink, rtt } = connectionInfo;

    if (effectiveType === '4g' && downlink > 1.5) {
      return { quality: 'excellent', color: 'green', icon: Zap };
    } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 0.5)) {
      return { quality: 'good', color: 'blue', icon: CheckCircle };
    } else if (effectiveType === '2g' || rtt > 1000) {
      return { quality: 'slow', color: 'yellow', icon: Clock };
    } else {
      return { quality: 'poor', color: 'red', icon: AlertTriangle };
    }
  };

  const connectionQuality = getConnectionQuality();

  // Offline alert
  if (showOfflineAlert) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md ${className}`}>
        <Alert className="border-red-500 bg-red-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="pr-8">
            <div className="mb-3">
              <strong className="text-red-800">You're Offline</strong>
              {offlineDuration && (
                <p className="text-sm text-red-600 mt-1">
                  Offline for {offlineDuration}
                </p>
              )}
              <p className="text-sm text-red-600 mt-1">
                You can still browse previously viewed vehicles and use cached features.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRetry} size="sm" className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Permanent status indicator
  if (showPermanent) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <>
            <Badge variant="outline" className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-green-500" />
              Online
            </Badge>
            {connectionQuality && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 text-${connectionQuality.color}-600 border-${connectionQuality.color}-300`}
              >
                <connectionQuality.icon className="h-3 w-3" />
                {connectionInfo?.effectiveType?.toUpperCase()}
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
      </div>
    );
  }

  return null;
}

// Connection quality indicator component
export function ConnectionQualityIndicator({ className = '' }: { className?: string }) {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  useEffect(() => {
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      }
    };

    updateConnectionInfo();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  if (!connectionInfo) return null;

  const getQualityDetails = () => {
    const { effectiveType, downlink, rtt, saveData } = connectionInfo;

    if (effectiveType === '4g' && downlink > 1.5) {
      return {
        label: 'Excellent Connection',
        description: 'High-speed browsing',
        color: 'green',
        icon: Zap,
        recommendation: 'Perfect for viewing high-quality images'
      };
    } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 0.5)) {
      return {
        label: 'Good Connection',
        description: 'Smooth browsing experience',
        color: 'blue',
        icon: CheckCircle,
        recommendation: 'Great for browsing vehicles and images'
      };
    } else if (effectiveType === '2g' || rtt > 1000) {
      return {
        label: 'Slow Connection',
        description: 'Limited data speed',
        color: 'yellow',
        icon: Clock,
        recommendation: 'Consider enabling data saver mode'
      };
    } else {
      return {
        label: 'Poor Connection',
        description: 'Very limited connectivity',
        color: 'red',
        icon: AlertTriangle,
        recommendation: 'Use offline features when possible'
      };
    }
  };

  const quality = getQualityDetails();
  const { label, description, color, icon: Icon, recommendation } = quality;

  return (
    <div className={`p-3 border rounded-lg bg-${color}-50 border-${color}-200 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 text-${color}-600`} />
        <span className={`font-medium text-${color}-800`}>{label}</span>
        <Badge variant="outline" className="text-xs">
          {connectionInfo.effectiveType?.toUpperCase()}
        </Badge>
      </div>
      <p className={`text-sm text-${color}-700 mb-1`}>{description}</p>
      <p className={`text-xs text-${color}-600`}>{recommendation}</p>

      {connectionInfo.saveData && (
        <div className="mt-2 flex items-center gap-1">
          <Download className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-600">Data Saver Mode Active</span>
        </div>
      )}
    </div>
  );
}

// Offline storage info component
export function OfflineStorageInfo({ className = '' }: { className?: string }) {
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const getStorageInfo = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageInfo({
            used: estimate.usage || 0,
            available: (estimate.quota || 0) - (estimate.usage || 0),
            total: estimate.quota || 0
          });
        } catch (error) {
          console.error('Failed to get storage estimate:', error);
        }
      }
    };

    getStorageInfo();
  }, []);

  if (!storageInfo) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const usagePercentage = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className={`p-3 border rounded-lg bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-800">Offline Storage</span>
        <span className="text-sm text-gray-600">
          {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        ></div>
      </div>

      <p className="text-xs text-gray-600">
        {formatBytes(storageInfo.available)} available for offline content
      </p>
    </div>
  );
}