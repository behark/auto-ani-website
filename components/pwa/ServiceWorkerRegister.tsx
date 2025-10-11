'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ServiceWorkerRegisterProps {
  showUpdatePrompt?: boolean;
}

export default function ServiceWorkerRegister({ showUpdatePrompt = true }: ServiceWorkerRegisterProps) {
  const [swStatus, setSWStatus] = useState<'installing' | 'installed' | 'error' | 'updating' | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Service Worker can be enabled for PWA features
    // Enable by setting NEXT_PUBLIC_ENABLE_SW=true in environment variables
    if (process.env.NEXT_PUBLIC_ENABLE_SW === 'true' && 'serviceWorker' in navigator) {
      const initializeServiceWorker = async () => {
        cleanup = await registerServiceWorker();
      };
      initializeServiceWorker();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const registerServiceWorker = async (): Promise<(() => void) | undefined> => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      logger.info('[SW] Service Worker registered successfully', { scope: registration.scope });
      setSWStatus('installed');

      // Check for updates on registration
      if (registration.installing) {
        setSWStatus('installing');
        trackInstalling(registration.installing);
      } else if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        logger.debug('[SW] Update found');
        setSWStatus('installing');
        const newWorker = registration.installing;

        if (newWorker) {
          trackInstalling(newWorker);
        }
      });

      // Check for updates every 30 minutes - store timer for cleanup
      const updateTimer = setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);

      // Listen for messages from service worker
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'VERSION_UPDATE') {
          setUpdateAvailable(true);
        }
      };
      navigator.serviceWorker.addEventListener('message', messageHandler);

      // Handle page reload when service worker takes control
      const controllerChangeHandler = () => {
        logger.debug('[SW] Controller changed, reloading page');
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

      // Return cleanup function
      return () => {
        clearInterval(updateTimer);
        navigator.serviceWorker.removeEventListener('message', messageHandler);
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
      };

    } catch (error) {
      logger.error('[SW] Service Worker registration failed', {}, error as Error);
      setSWStatus('error');
      return undefined;
    }
  };

  const trackInstalling = (worker: ServiceWorker) => {
    worker.addEventListener('statechange', () => {
      logger.debug('[SW] State changed', { state: worker.state });

      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Update available
          setWaitingWorker(worker);
          setUpdateAvailable(true);
          setSWStatus('updating');
        } else {
          // First install
          setSWStatus('installed');
        }
      } else if (worker.state === 'activated') {
        setSWStatus('installed');
        setUpdateAvailable(false);
      }
    });
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      // Page will reload automatically due to controllerchange event
    }
  };

  const handleDismissUpdate = () => {
    setUpdateAvailable(false);
  };

  // Show update prompt if there's an update available
  if (updateAvailable && showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <Alert className="border-blue-500 bg-blue-50">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="pr-8">
            <div className="mb-3">
              <strong>App Update Available</strong>
              <p className="text-sm text-gray-600 mt-1">
                A new version of AUTO ANI is ready. Update now for the latest features and improvements.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Update Now
              </Button>
              <Button onClick={handleDismissUpdate} variant="outline" size="sm">
                Later
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show installation status (for debugging/admin)
  if (process.env.NODE_ENV === 'development' && swStatus) {
    const getStatusMessage = () => {
      switch (swStatus) {
        case 'installing':
          return { message: 'Installing service worker...', icon: RefreshCw, color: 'blue' };
        case 'installed':
          return { message: 'Service worker active', icon: CheckCircle, color: 'green' };
        case 'updating':
          return { message: 'Update available', icon: RefreshCw, color: 'blue' };
        case 'error':
          return { message: 'Service worker error', icon: AlertTriangle, color: 'red' };
        default:
          return null;
      }
    };

    const status = getStatusMessage();
    if (!status) return null;

    const { message, icon: Icon, color } = status;

    return (
      <div className="fixed bottom-20 right-4 z-40">
        <div className={`bg-${color}-100 border border-${color}-300 rounded-lg p-2 text-${color}-800 text-sm flex items-center gap-2`}>
          <Icon className="h-4 w-4" />
          {message}
        </div>
      </div>
    );
  }

  return null;
}

// Hook for PWA utilities
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');
      setIsInstalled(installed);
    };

    // Check online status
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    // Get service worker registration
    const getSWRegistration = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        setSWRegistration(registration || null);
      }
    };

    checkInstalled();
    checkOnline();
    getSWRegistration();

    // Listen for online/offline events
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const subscribeToPush = async () => {
    if (!swRegistration) return null;

    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', {}, error as Error);
      return null;
    }
  };

  const shareContent = async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        logger.error('Error sharing content', {}, error as Error);
        return false;
      }
    }
    return false;
  };

  const addToHomeScreen = async () => {
    // This would trigger the install prompt if available
    window.dispatchEvent(new Event('beforeinstallprompt'));
  };

  return {
    isInstalled,
    isOnline,
    swRegistration,
    requestNotificationPermission,
    subscribeToPush,
    shareContent,
    addToHomeScreen
  };
}