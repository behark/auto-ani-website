'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Cookie,
  Shield,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: Array<{
    name: string;
    purpose: string;
    duration: string;
    domain?: string;
  }>;
}

interface CookieConsentProps {
  className?: string;
}

export default function CookieConsent({ className = '' }: CookieConsentProps) {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: 'necessary',
      name: 'Necessary Cookies',
      description: 'These cookies are essential for the website to function properly. They enable basic functionality such as security, network management, and accessibility.',
      required: true,
      enabled: true,
      cookies: [
        {
          name: 'session_id',
          purpose: 'Maintains user session state',
          duration: 'Session',
          domain: 'autosalonani.com'
        },
        {
          name: 'csrf_token',
          purpose: 'Prevents cross-site request forgery attacks',
          duration: '1 hour',
          domain: 'autosalonani.com'
        },
        {
          name: 'cookie_consent',
          purpose: 'Stores your cookie preferences',
          duration: '1 year',
          domain: 'autosalonani.com'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'These cookies enhance functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.',
      required: false,
      enabled: false,
      cookies: [
        {
          name: 'language_preference',
          purpose: 'Remembers your preferred language',
          duration: '1 year',
          domain: 'autosalonani.com'
        },
        {
          name: 'favorites_data',
          purpose: 'Stores your favorite vehicles',
          duration: '1 year',
          domain: 'autosalonani.com'
        },
        {
          name: 'accessibility_settings',
          purpose: 'Stores your accessibility preferences',
          duration: '1 year',
          domain: 'autosalonani.com'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      required: false,
      enabled: false,
      cookies: [
        {
          name: '_ga',
          purpose: 'Google Analytics - distinguishes users',
          duration: '2 years',
          domain: '.autosalonani.com'
        },
        {
          name: '_ga_*',
          purpose: 'Google Analytics - session identification',
          duration: '2 years',
          domain: '.autosalonani.com'
        },
        {
          name: '_gid',
          purpose: 'Google Analytics - distinguishes users',
          duration: '24 hours',
          domain: '.autosalonani.com'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'These cookies track visitors across websites. The intention is to display ads that are relevant and engaging for individual users.',
      required: false,
      enabled: false,
      cookies: [
        {
          name: '_fbp',
          purpose: 'Facebook Pixel - tracks conversions',
          duration: '3 months',
          domain: '.autosalonani.com'
        },
        {
          name: 'fr',
          purpose: 'Facebook advertising cookie',
          duration: '3 months',
          domain: '.facebook.com'
        }
      ]
    }
  ]);

  // Check if consent has been given
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const consentData = JSON.parse(consent);
        setCategories(prev => prev.map(cat => ({
          ...cat,
          enabled: cat.required || consentData.categories?.[cat.id] || false
        })));
      } catch (error) {
        logger.error('Failed to parse consent data:', { error: error instanceof Error ? error.message : String(error) });
        setShowBanner(true);
      }
    }
  }, []);

  const updateCategory = (categoryId: string, enabled: boolean) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, enabled } : cat
    ));
  };

  const saveConsent = (acceptAll = false) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      categories: acceptAll
        ? Object.fromEntries(categories.map(cat => [cat.id, true]))
        : Object.fromEntries(categories.map(cat => [cat.id, cat.enabled]))
    };

    localStorage.setItem('cookie_consent', JSON.stringify(consentData));

    // Apply consent settings
    applyConsentSettings(consentData.categories);

    setShowBanner(false);
    setShowSettings(false);

    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: consentData
    }));
  };

  const applyConsentSettings = (consentCategories: Record<string, boolean>) => {
    // Load/unload scripts based on consent
    if (consentCategories.analytics) {
      loadGoogleAnalytics();
    } else {
      removeGoogleAnalytics();
    }

    if (consentCategories.marketing) {
      loadFacebookPixel();
    } else {
      removeFacebookPixel();
    }
  };

  const loadGoogleAnalytics = () => {
    if (typeof window.gtag !== 'undefined') return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
    document.head.appendChild(script);

    script.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        anonymize_ip: true,
        cookie_flags: 'secure;samesite=strict'
      });
    };
  };

  const removeGoogleAnalytics = () => {
    // Clear GA cookies
    const gaCookies = document.cookie.split(';').filter(cookie =>
      cookie.trim().startsWith('_ga') || cookie.trim().startsWith('_gid')
    );

    gaCookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.autosalonani.com`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Remove gtag if exists
    if (typeof window.gtag !== 'undefined') {
      delete (window as any).gtag;
    }
  };

  const loadFacebookPixel = () => {
    if (typeof window.fbq !== 'undefined') return;

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'FACEBOOK_PIXEL_ID');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  };

  const removeFacebookPixel = () => {
    // Clear Facebook cookies
    const fbCookies = document.cookie.split(';').filter(cookie =>
      cookie.trim().startsWith('_fb') || cookie.trim().startsWith('fr')
    );

    fbCookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.facebook.com`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.autosalonani.com`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Remove fbq if exists
    if (typeof window.fbq !== 'undefined') {
      delete (window as any).fbq;
    }
  };

  const handleAcceptAll = () => {
    setCategories(prev => prev.map(cat => ({ ...cat, enabled: true })));
    saveConsent(true);
  };

  const handleAcceptSelected = () => {
    saveConsent(false);
  };

  const handleRejectAll = () => {
    setCategories(prev => prev.map(cat => ({ ...cat, enabled: cat.required })));
    saveConsent(false);
  };

  // Cookie settings modal
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden m-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Privacy & Cookie Settings</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-600 mt-2">
              We use cookies to enhance your browsing experience, serve personalized content,
              and analyze our traffic. Choose which cookies you allow us to use.
            </p>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      {category.required && (
                        <Badge variant="secondary">Required</Badge>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={category.enabled}
                      disabled={category.required}
                      onChange={(e) => updateCategory(category.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <p className="text-gray-600 mb-4">{category.description}</p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Cookies used:</h4>
                    {category.cookies.map((cookie, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{cookie.name}</span>
                          <span className="text-gray-500">{cookie.duration}</span>
                        </div>
                        <p className="text-gray-600">{cookie.purpose}</p>
                        {cookie.domain && (
                          <p className="text-gray-500 text-xs mt-1">Domain: {cookie.domain}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <div className="border-t p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleRejectAll} variant="outline">
                  Reject All
                </Button>
                <Button onClick={handleAcceptSelected} className="bg-blue-600 hover:bg-blue-700">
                  Save Preferences
                </Button>
                <Button onClick={handleAcceptAll} className="bg-green-600 hover:bg-green-700">
                  Accept All
                </Button>
              </div>
              <Button variant="link" asChild className="text-sm">
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Privacy Policy
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Cookie consent banner
  if (showBanner) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        <Card className="rounded-none border-x-0 border-b-0 bg-white shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">We value your privacy</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    We use cookies to enhance your browsing experience, serve personalized content,
                    and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="h-3 w-3" />
                    <span>
                      Essential cookies are always enabled. You can customize your preferences anytime.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Necessary Only
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook for accessing cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<{
    given: boolean;
    categories: Record<string, boolean>;
    timestamp?: string;
  }>({
    given: false,
    categories: {}
  });

  useEffect(() => {
    const checkConsent = () => {
      const storedConsent = localStorage.getItem('cookie_consent');
      if (storedConsent) {
        try {
          const data = JSON.parse(storedConsent);
          setConsent({
            given: true,
            categories: data.categories || {},
            timestamp: data.timestamp
          });
        } catch (error) {
          setConsent({ given: false, categories: {} });
        }
      }
    };

    checkConsent();

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      setConsent({
        given: true,
        categories: event.detail.categories || {},
        timestamp: event.detail.timestamp
      });
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener);
    };
  }, []);

  const updateConsent = (category: string, enabled: boolean) => {
    const storedConsent = localStorage.getItem('cookie_consent');
    if (storedConsent) {
      try {
        const data = JSON.parse(storedConsent);
        data.categories[category] = enabled;
        data.timestamp = new Date().toISOString();
        localStorage.setItem('cookie_consent', JSON.stringify(data));

        setConsent({
          given: true,
          categories: data.categories,
          timestamp: data.timestamp
        });

        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
          detail: data
        }));
      } catch (error) {
        logger.error('Failed to update consent:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  };

  return {
    consent,
    hasConsent: (category: string) => consent.categories[category] === true,
    updateConsent
  };
}