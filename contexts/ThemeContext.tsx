'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load theme from storage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    setMounted(true);
  }, [storageKey]);

  // Calculate effective theme
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Apply current theme
    root.classList.add(effectiveTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        effectiveTheme === 'dark' ? '#20262f' : '#ffffff'
      );
    }

    // Update CSS custom properties for smooth transitions
    root.style.setProperty(
      '--theme-transition',
      'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
    );
  }, [effectiveTheme, mounted]);

  // Save theme to storage
  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    setThemeState(newTheme);
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const currentEffective = effectiveTheme;
    setTheme(currentEffective === 'light' ? 'dark' : 'light');
  };

  // Prevent hydration mismatch by rendering with system theme until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: 'system',
          effectiveTheme: 'light',
          setTheme: () => {},
          toggleTheme: () => {},
          systemTheme: 'light',
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        systemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme persistence utilities
export const themeUtils = {
  // Get theme from storage without context
  getStoredTheme: (storageKey = 'theme'): Theme => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  },

  // Get system preference
  getSystemTheme: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  // Get effective theme without context
  getEffectiveTheme: (theme?: Theme): 'light' | 'dark' => {
    const currentTheme = theme || themeUtils.getStoredTheme();
    return currentTheme === 'system' ? themeUtils.getSystemTheme() : currentTheme;
  },

  // Apply theme immediately (for SSR/initial load)
  applyTheme: (theme: Theme) => {
    if (typeof window === 'undefined') return;

    const effectiveTheme = themeUtils.getEffectiveTheme(theme);
    const root = document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  },
};

// Theme script for preventing flash of wrong theme
export const themeScript = `
  try {
    const theme = localStorage.getItem('theme') || 'system';
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);

    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = effectiveTheme === 'dark' ? '#20262f' : '#ffffff';
    }
  } catch (error) {
    console.warn('Theme initialization failed:', error);
    document.documentElement.classList.add('light');
  }
`;