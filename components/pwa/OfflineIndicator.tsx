'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Initial online status
    setIsOnline(navigator.onLine);

    // Get connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown');
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowOfflineMessage(true);
        // Hide the "back online" message after 5 seconds
        setTimeout(() => setShowOfflineMessage(false), 5000);
      }
      setWasOffline(false);
      setOfflineStartTime(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setOfflineStartTime(new Date());
      setShowOfflineMessage(true);
    };

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection API listeners
    const navConnection = (navigator as any).connection;
    if (navConnection) {
      navConnection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navConnection) {
        navConnection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [wasOffline]);

  const handleRetry = () => {
    window.location.reload();
  };

  const dismissMessage = () => {
    setShowOfflineMessage(false);
  };

  const formatOfflineTime = () => {
    if (!offlineStartTime) return '';

    const now = new Date();
    const diffMs = now.getTime() - offlineStartTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);

    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    }
    return `${diffSeconds}s`;
  };

  const getConnectionQuality = () => {
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return { label: 'Slow', color: 'bg-red-500' };
      case '3g':
        return { label: 'Good', color: 'bg-yellow-500' };
      case '4g':
        return { label: 'Fast', color: 'bg-green-500' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500' };
    }
  };

  return (
    <>
      {/* Status indicator in header/top bar */}
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-4 w-4" />
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
              Online
            </Badge>
            {connectionType !== 'unknown' && (
              <div className={`w-2 h-2 rounded-full ${getConnectionQuality().color}`}
                   title={`Connection: ${getConnectionQuality().label}`} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <WifiOff className="h-4 w-4" />
            <Badge variant="destructive" className="text-xs">
              Offline {offlineStartTime && `• ${formatOfflineTime()}`}
            </Badge>
          </div>
        )}
      </div>

      {/* Full offline message */}
      {showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-md">
          <div className="container mx-auto px-4 py-3">
            {isOnline ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Wifi className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800">You're back online!</h3>
                        <p className="text-sm text-green-600">
                          Connection restored. All features are now available.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissMessage}
                      className="text-green-700 hover:text-green-800"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-800">You're currently offline</h3>
                        <p className="text-sm text-amber-600 mb-3">
                          Don't worry! You can still browse vehicles you've already viewed.
                          Some features may be limited until connection is restored.
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs text-amber-700">
                          <Badge variant="outline" className="border-amber-300">
                            ✓ View cached vehicles
                          </Badge>
                          <Badge variant="outline" className="border-amber-300">
                            ✓ Browse offline content
                          </Badge>
                          <Badge variant="outline" className="border-amber-300">
                            ✗ Submit forms
                          </Badge>
                          <Badge variant="outline" className="border-amber-300">
                            ✗ Real-time updates
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissMessage}
                        className="text-amber-700 hover:text-amber-800"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Hook for components to use offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline
  };
}

// Component for showing offline capabilities in the app
export function OfflineCapabilities() {
  const { isOnline } = useOfflineStatus();

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isOnline ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-600" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium mb-2">
              {isOnline ? 'Online Mode' : 'Offline Mode'}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Browse all vehicles and content
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  !isOnline ? 'bg-green-500' : 'bg-green-500'
                }`} />
                View previously loaded vehicles
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Submit contact forms and appointments
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Get real-time updates and pricing
              </div>
            </div>

            {!isOnline && (
              <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-700">
                💡 Forms submitted while offline will be saved and sent when connection returns.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}