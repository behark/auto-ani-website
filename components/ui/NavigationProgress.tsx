'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TopLoadingBar, PageLoadingIndicator } from './LoadingIndicator';

interface NavigationProgressContextType {
  isLoading: boolean;
  progress: number;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number | ((prev: number) => number)) => void;
}

const NavigationProgressContext = createContext<NavigationProgressContextType | undefined>(undefined);

interface NavigationProgressProviderProps {
  children: ReactNode;
  showTopBar?: boolean;
  showFullPageLoader?: boolean;
  loadingVariant?: 'bar' | 'spinner' | 'dots' | 'car' | 'minimal';
  delay?: number;
}

export function NavigationProgressProvider({
  children,
  showTopBar = true,
  showFullPageLoader = false,
  loadingVariant = 'car',
  delay = 100,
}: NavigationProgressProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  // Auto-detect navigation changes
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let completionTimer: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      progressTimer = setInterval(() => {
        setProgress((prev: number) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      // Complete after delay
      completionTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, delay + 500);
    };

    // Start loading after small delay to avoid flashing
    const delayTimer = setTimeout(startLoading, delay);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(completionTimer);
      clearInterval(progressTimer);
    };
  }, [pathname, delay]);

  const contextValue = {
    isLoading,
    progress,
    setLoading: setIsLoading,
    setProgress,
  };

  return (
    <NavigationProgressContext.Provider value={contextValue}>
      {/* Top loading bar */}
      {showTopBar && <TopLoadingBar />}

      {/* Full page loader */}
      {showFullPageLoader && (
        <AnimatePresence>
          {isLoading && <PageLoadingIndicator variant={loadingVariant} />}
        </AnimatePresence>
      )}

      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (context === undefined) {
    throw new Error('useNavigationProgress must be used within a NavigationProgressProvider');
  }
  return context;
}

// Higher-order component for manual loading control
export function withLoadingState<T extends object>(
  Component: React.ComponentType<T>
) {
  return function LoadingWrapper(props: T) {
    const { setLoading } = useNavigationProgress();

    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    return (
      <Component
        {...props}
        startLoading={startLoading}
        stopLoading={stopLoading}
      />
    );
  };
}

// Hook for manual navigation with loading
export function useNavigateWithLoading() {
  const router = useRouter();
  const { setLoading, setProgress } = useNavigationProgress();

  const navigate = (url: string, options?: { replace?: boolean }) => {
    setLoading(true);
    setProgress(20);

    // Simulate progress during navigation
    const progressInterval = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    try {
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }

      // Complete progress after navigation
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 200);
        clearInterval(progressInterval);
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
      throw error;
    }
  };

  return navigate;
}

// Loading overlay component
export function LoadingOverlay({
  isVisible,
  message = 'Loading...',
  variant = 'spinner',
  blur = true,
}: {
  isVisible: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'minimal';
  blur?: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            blur ? 'backdrop-blur-sm bg-white/70 dark:bg-gray-900/70' : 'bg-white dark:bg-gray-900'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PageLoadingIndicator
            variant={variant}
            showMessage={true}
            className="bg-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Breadcrumb-style loading indicator
export function BreadcrumbLoader({
  steps,
  currentStep,
  className,
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <motion.div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              index <= currentStep
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: index === currentStep ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {index < currentStep ? '✓' : index + 1}
          </motion.div>
          <span
            className={`text-sm ${
              index <= currentStep
                ? 'text-orange-600 dark:text-orange-400 font-medium'
                : 'text-gray-500'
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
          )}
        </div>
      ))}
    </div>
  );
}

// Inline loading component for buttons and links
export function InlineLoader({
  isLoading,
  children,
  loadingText = 'Loading...',
  className,
}: {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-sm">{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}