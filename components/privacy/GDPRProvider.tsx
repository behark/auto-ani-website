'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCookieConsent } from './CookieConsent';

interface UserData {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  preferences: {
    language: string;
    newsletter: boolean;
    marketing: boolean;
    analytics: boolean;
  };
  activities: Array<{
    type: string;
    timestamp: string;
    details: any;
  }>;
  consents: Array<{
    type: string;
    given: boolean;
    timestamp: string;
    version: string;
  }>;
}

interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataTypes: string[];
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retentionPeriod: string;
  thirdParties?: string[];
  automated?: boolean;
}

interface GDPRContextType {
  userData: UserData | null;
  dataProcessingActivities: DataProcessingActivity[];
  requestDataExport: () => Promise<Blob>;
  requestDataDeletion: () => Promise<boolean>;
  updateUserConsent: (type: string, given: boolean) => void;
  logActivity: (type: string, details: Record<string, unknown>) => void;
  isDataMinimized: boolean;
  privacyNotices: Array<{
    id: string;
    title: string;
    content: string;
    version: string;
    effective: string;
  }>;
  userRights: {
    access: boolean;
    rectification: boolean;
    erasure: boolean;
    restriction: boolean;
    portability: boolean;
    objection: boolean;
  };
}

const GDPRContext = createContext<GDPRContextType | undefined>(undefined);

interface GDPRProviderProps {
  children: ReactNode;
}

export function GDPRProvider({ children }: GDPRProviderProps) {
  const { consent } = useCookieConsent();
  const [userData, setUserData] = useState<UserData | null>(null);

  const dataProcessingActivities: DataProcessingActivity[] = [
    {
      id: 'website_analytics',
      name: 'Website Analytics',
      purpose: 'To understand how users interact with our website and improve user experience',
      dataTypes: ['IP address', 'Browser information', 'Page views', 'Session duration'],
      legalBasis: 'consent',
      retentionPeriod: '26 months',
      thirdParties: ['Google Analytics'],
      automated: true
    },
    {
      id: 'vehicle_inquiries',
      name: 'Vehicle Inquiries',
      purpose: 'To respond to customer inquiries about vehicles and provide customer service',
      dataTypes: ['Name', 'Email', 'Phone number', 'Vehicle preferences', 'Message content'],
      legalBasis: 'contract',
      retentionPeriod: '3 years',
      automated: false
    },
    {
      id: 'marketing_communications',
      name: 'Marketing Communications',
      purpose: 'To send promotional materials and updates about new vehicles',
      dataTypes: ['Email address', 'Name', 'Preferences'],
      legalBasis: 'consent',
      retentionPeriod: 'Until consent withdrawn',
      automated: true
    },
    {
      id: 'favorites_management',
      name: 'Favorites Management',
      purpose: 'To store and manage user favorite vehicles',
      dataTypes: ['Vehicle preferences', 'User identifier', 'Timestamps'],
      legalBasis: 'legitimate_interests',
      retentionPeriod: '1 year',
      automated: false
    },
    {
      id: 'financing_calculations',
      name: 'Financing Calculations',
      purpose: 'To provide personalized financing options and calculations',
      dataTypes: ['Financial preferences', 'Calculation history'],
      legalBasis: 'legitimate_interests',
      retentionPeriod: '6 months',
      automated: true
    }
  ];

  const privacyNotices = [
    {
      id: 'privacy_policy',
      title: 'Privacy Policy',
      content: 'Our comprehensive privacy policy explaining how we collect, use, and protect your data.',
      version: '2.1',
      effective: '2024-01-01'
    },
    {
      id: 'cookie_policy',
      title: 'Cookie Policy',
      content: 'Information about how we use cookies and similar technologies.',
      version: '1.5',
      effective: '2024-01-01'
    },
    {
      id: 'data_retention',
      title: 'Data Retention Policy',
      content: 'How long we keep your data and why.',
      version: '1.2',
      effective: '2024-01-01'
    }
  ];

  const userRights = {
    access: true,        // Right to access personal data
    rectification: true, // Right to rectify inaccurate data
    erasure: true,       // Right to be forgotten
    restriction: true,   // Right to restrict processing
    portability: true,   // Right to data portability
    objection: true      // Right to object to processing
  };

  // Initialize user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('gdpr_user_data');
    if (storedUserData) {
      try {
        const data = JSON.parse(storedUserData);
        setUserData(data);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // Initialize with minimal data
        initializeUserData();
      }
    } else {
      initializeUserData();
    }
  }, []);

  const initializeUserData = () => {
    const newUserData: UserData = {
      id: generateUserId(),
      preferences: {
        language: 'sq',
        newsletter: false,
        marketing: false,
        analytics: false
      },
      activities: [],
      consents: []
    };

    setUserData(newUserData);
    localStorage.setItem('gdpr_user_data', JSON.stringify(newUserData));
  };

  const generateUserId = () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const updateUserConsent = (type: string, given: boolean) => {
    if (!userData) return;

    const newConsent = {
      type,
      given,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const updatedUserData = {
      ...userData,
      consents: [
        ...userData.consents.filter(c => c.type !== type),
        newConsent
      ]
    };

    setUserData(updatedUserData);
    localStorage.setItem('gdpr_user_data', JSON.stringify(updatedUserData));

    // Log the consent change
    logActivity('consent_updated', { type, given, timestamp: newConsent.timestamp });
  };

  const logActivity = (type: string, details: Record<string, unknown>) => {
    if (!userData) return;

    const activity = {
      type,
      timestamp: new Date().toISOString(),
      details
    };

    const updatedUserData = {
      ...userData,
      activities: [...userData.activities, activity].slice(-100) // Keep last 100 activities
    };

    setUserData(updatedUserData);
    localStorage.setItem('gdpr_user_data', JSON.stringify(updatedUserData));
  };

  const requestDataExport = async (): Promise<Blob> => {
    if (!userData) {
      throw new Error('No user data available');
    }

    // Collect all user data
    const exportData = {
      userData,
      cookieConsent: localStorage.getItem('cookie_consent'),
      favorites: localStorage.getItem('favorites'),
      searchHistory: localStorage.getItem('search_history'),
      calculatorHistory: localStorage.getItem('calculator_history'),
      accessibilitySettings: localStorage.getItem('accessibility-settings'),
      dataProcessingActivities,
      exportTimestamp: new Date().toISOString(),
      exportVersion: '1.0'
    };

    // Log the export request
    logActivity('data_export_requested', {
      timestamp: exportData.exportTimestamp,
      dataTypes: Object.keys(exportData)
    });

    // Create JSON blob
    const dataStr = JSON.stringify(exportData, null, 2);
    return new Blob([dataStr], { type: 'application/json' });
  };

  const requestDataDeletion = async (): Promise<boolean> => {
    try {
      // Log the deletion request before removing data
      logActivity('data_deletion_requested', {
        timestamp: new Date().toISOString(),
        dataTypes: ['all_user_data']
      });

      // Clear all user data from localStorage
      const keysToRemove = [
        'gdpr_user_data',
        'cookie_consent',
        'favorites',
        'search_history',
        'calculator_history',
        'accessibility-settings',
        'pwa-install-prompt-dismissed',
        'pwa-install-prompt-time'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.autosalonani.com`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Reset user data
      setUserData(null);

      // In a real application, this would also trigger server-side deletion
      // await fetch('/api/gdpr/delete-user-data', { method: 'POST' });

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  };

  const isDataMinimized = (): boolean => {
    if (!userData) return true;

    // Check if we're only collecting necessary data
    const hasMinimalData = !userData.email && !userData.phone;
    const hasConsentForOptional = consent.given && (
      consent.categories.analytics ||
      consent.categories.marketing ||
      consent.categories.functional
    );

    return hasMinimalData || hasConsentForOptional;
  };

  const value: GDPRContextType = {
    userData,
    dataProcessingActivities,
    requestDataExport,
    requestDataDeletion,
    updateUserConsent,
    logActivity,
    isDataMinimized: isDataMinimized(),
    privacyNotices,
    userRights
  };

  return (
    <GDPRContext.Provider value={value}>
      {children}
    </GDPRContext.Provider>
  );
}

export function useGDPR() {
  const context = useContext(GDPRContext);
  if (context === undefined) {
    throw new Error('useGDPR must be used within a GDPRProvider');
  }
  return context;
}

// GDPR Analytics wrapper that respects consent
export function useGDPRAnalytics() {
  const { consent } = useCookieConsent();
  const { logActivity } = useGDPR();

  const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
    if (consent.categories.analytics && typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, parameters);
    }

    // Always log to our internal activity log (with consent)
    if (consent.categories.functional) {
      logActivity('analytics_event', { event: eventName, parameters });
    }
  };

  const trackPageView = (pagePath: string) => {
    if (consent.categories.analytics && typeof window.gtag !== 'undefined') {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pagePath
      });
    }

    if (consent.categories.functional) {
      logActivity('page_view', { path: pagePath });
    }
  };

  return {
    trackEvent,
    trackPageView,
    isAnalyticsEnabled: consent.categories.analytics
  };
}

// GDPR Marketing wrapper
export function useGDPRMarketing() {
  const { consent } = useCookieConsent();
  const { logActivity } = useGDPR();

  const trackConversion = (conversionData: Record<string, unknown>) => {
    if (consent.categories.marketing && typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Lead', conversionData);
    }

    if (consent.categories.functional) {
      logActivity('conversion_tracked', conversionData);
    }
  };

  const canShowAds = () => {
    return consent.categories.marketing;
  };

  return {
    trackConversion,
    canShowAds,
    isMarketingEnabled: consent.categories.marketing
  };
}