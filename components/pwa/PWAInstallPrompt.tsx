'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor, Tablet, Wifi, WifiOff, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');

    setIsInstalled(isAppInstalled);

    // Detect device type
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      setDeviceType(/iPad/i.test(userAgent) ? 'tablet' : 'mobile');
    } else if (/iPad/i.test(userAgent)) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);

      // Show prompt after a delay (better UX)
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
        const lastPromptTime = localStorage.getItem('pwa-install-prompt-time');
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        // Show prompt if user hasn't dismissed it or if it's been 7 days since last dismissal
        if (!hasSeenPrompt || (lastPromptTime && parseInt(lastPromptTime) < sevenDaysAgo)) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
        localStorage.setItem('pwa-install-accepted', 'true');
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-6 w-6" />;
      case 'tablet':
        return <Tablet className="h-6 w-6" />;
      default:
        return <Monitor className="h-6 w-6" />;
    }
  };

  const getInstallText = () => {
    switch (deviceType) {
      case 'mobile':
        return {
          title: 'Instalo Aplikacionin AUTO ANI',
          description: 'Merrni përvojën e plotë AUTO ANI në telefonin tuaj. Qasje në vetura offline, njoftimet për arritjet e reja, dhe shfletim më i shpejtë.',
          benefits: [
            'Qasje e menjëhershme nga home screen',
            'Shfleto vetura edhe offline',
            'Njoftime push për vetura të reja',
            'Kohë ngarkimi më të shpejta',
            'Përvojë full-screen'
          ]
        };
      case 'tablet':
        return {
          title: 'Instalo AUTO ANI në Tabletin tuaj',
          description: 'Shijoni përvojën AUTO ANI të optimizuar për tabletin tuaj. Perfekte për shfletimin e galerisë së veturave me imazhe më të mëdha.',
          benefits: [
            'Ndërfaqe e optimizuar për tablet',
            'Përvojë më e mirë e shikimit të imazheve',
            'Aftësi shfletimi offline',
            'Qasje e shpejtë nga home screen',
            'Navigim i përmirësuar me prekje'
          ]
        };
      default:
        return {
          title: 'Instalo Aplikacionin AUTO ANI Desktop',
          description: 'Merrni AUTO ANI-n si një aplikacion desktop për qasje më të lehtë dhe përvojë më të fokusuar shfletimi.',
          benefits: [
            'Përvojë aplikacioni desktop',
            'Dritare e dedikuar për vetura',
            'Qasje më e shpejtë se shfletuesi',
            'Funksionalitet offline',
            'Njoftime sistemi'
          ]
        };
    }
  };

  // Don't show if already installed or prompt not available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  const { title, description, benefits } = getInstallText();

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm ${className}`}>
      <Card className="border-[var(--primary-orange)] bg-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-orange)] rounded-lg flex items-center justify-center text-white">
                {getDeviceIcon()}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            {description}
          </p>

          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Përfitimet:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[var(--primary-orange)] rounded-full"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalo App
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
            >
              Më vonë
            </Button>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            Pa shkarkime • Instalohet nga shfletuesi juaj
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// PWA Status Component for showing installation status in settings/about
export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkPWAStatus = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');

      const supported = 'serviceWorker' in navigator;

      setIsInstalled(installed);
      setIsSupported(supported);
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkPWAStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Progressive Web App</h3>
            <p className="text-sm text-gray-600">
              {isInstalled
                ? '✅ E instaluar si aplikacion'
                : isSupported
                  ? '📱 E disponueshme për instalim'
                  : '❌ Nuk mbështetet në këtë pajisje'
              }
            </p>
            <div className="mt-1 text-xs text-gray-500">
              Status: {isOnline ? '🌐 Online' : '📡 Offline'}
            </div>
          </div>
          <div className="text-right space-y-1">
            {isInstalled && (
              <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                APP MODE
              </div>
            )}
            <div className={`text-xs px-2 py-1 rounded font-medium ${
              isOnline
                ? 'text-green-600 bg-green-50'
                : 'text-orange-600 bg-orange-50'
            }`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact PWA Status Indicator for headers/status bars
export function PWAStatusIndicator({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');

      setIsInstalled(installed);
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isInstalled) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Check className="h-4 w-4 text-green-500" />
        {showText && <span className="text-xs text-green-600 font-medium">PWA</span>}
      </div>
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-500" />
        )}
        {showText && (
          <span className={`text-xs font-medium ${
            isOnline ? 'text-green-600' : 'text-orange-600'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        )}
      </div>
    </div>
  );
}