'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  isReducedMotion: boolean;
  isHighContrast: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const {
    announce,
    prefersReducedMotion,
    prefersHighContrast
  } = useAccessibility();

  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true
  });

  // Initialize settings from localStorage and system preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }

    // Apply system preferences
    setSettings(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast
    }));
  }, [prefersReducedMotion, prefersHighContrast]);

  // Apply accessibility styles to document
  useEffect(() => {
    const root = document.documentElement;

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [settings]);

  // Detect screen reader usage
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        window.speechSynthesis ||
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.navigator.userAgent.includes('VoiceOver')
      );

      if (hasScreenReader) {
        setSettings(prev => ({ ...prev, screenReader: true }));
      }
    };

    detectScreenReader();
  }, []);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      return newSettings;
    });

    // Announce setting changes
    announce(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`);
  };

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    isReducedMotion: settings.reducedMotion || prefersReducedMotion,
    isHighContrast: settings.highContrast || prefersHighContrast
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility Settings Panel Component
export function AccessibilitySettings() {
  const { settings, updateSetting } = useAccessibilityContext();

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Accessibility Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="reduced-motion" className="font-medium text-gray-700">
              Reduced Motion
            </label>
            <p className="text-sm text-gray-600">
              Minimize animations and transitions
            </p>
          </div>
          <input
            id="reduced-motion"
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="high-contrast" className="font-medium text-gray-700">
              High Contrast
            </label>
            <p className="text-sm text-gray-600">
              Increase color contrast for better visibility
            </p>
          </div>
          <input
            id="high-contrast"
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => updateSetting('highContrast', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="large-text" className="font-medium text-gray-700">
              Large Text
            </label>
            <p className="text-sm text-gray-600">
              Increase text size for better readability
            </p>
          </div>
          <input
            id="large-text"
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => updateSetting('largeText', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="focus-visible" className="font-medium text-gray-700">
              Enhanced Focus Indicators
            </label>
            <p className="text-sm text-gray-600">
              Show clearer focus outlines for keyboard navigation
            </p>
          </div>
          <input
            id="focus-visible"
            type="checkbox"
            checked={settings.focusVisible}
            onChange={(e) => updateSetting('focusVisible', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium text-gray-700 mb-2">System Detected</h4>
        <div className="space-y-1 text-sm text-gray-600">
          {settings.screenReader && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Screen reader detected
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Keyboard navigation enabled
          </div>
        </div>
      </div>
    </div>
  );
}

// Accessibility Toolbar (floating)
export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting, announce } = useAccessibilityContext();

  const toggleToolbar = () => {
    setIsOpen(!isOpen);
    announce(isOpen ? 'Accessibility toolbar closed' : 'Accessibility toolbar opened');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleToolbar}
        aria-label="Accessibility options"
        aria-expanded={isOpen}
        className="fixed bottom-4 left-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L13 7C12.4 7 12 7.4 12 8V16C12 16.6 12.4 17 13 17H21V15H14V13H19V11H14V9H21ZM11 7H3V9H8V11H3V13H8V15H3V17H11C11.6 17 12 16.6 12 16V8C12 7.4 11.6 7 11 7Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Toolbar panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 left-4 bg-white border rounded-lg shadow-xl p-4 z-50 w-80"
          role="dialog"
          aria-label="Accessibility settings"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Quick Accessibility</h3>
            <button
              onClick={toggleToolbar}
              aria-label="Close accessibility options"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
              className={`w-full text-left p-2 rounded border ${
                settings.reducedMotion
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">Reduce Motion</div>
              <div className="text-sm text-gray-600">Minimize animations</div>
            </button>

            <button
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={`w-full text-left p-2 rounded border ${
                settings.highContrast
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">High Contrast</div>
              <div className="text-sm text-gray-600">Increase visibility</div>
            </button>

            <button
              onClick={() => updateSetting('largeText', !settings.largeText)}
              className={`w-full text-left p-2 rounded border ${
                settings.largeText
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">Large Text</div>
              <div className="text-sm text-gray-600">Bigger text size</div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}