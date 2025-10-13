'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import { Car, Loader2, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  className?: string;
  variant?: 'bar' | 'spinner' | 'dots' | 'car' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showMessage?: boolean;
  color?: string;
}

// Inner component that uses searchParams
function PageLoadingIndicatorInner({
  className,
  variant = 'car',
  size = 'md',
  showProgress = true,
  showMessage = true,
  color = 'orange',
}: LoadingIndicatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  // Messages for different routes
  const loadingMessages = {
    '/': 'Loading homepage...',
    '/vehicles': 'Loading vehicles...',
    '/about': 'Loading about us...',
    '/contact': 'Loading contact info...',
    '/services': 'Loading services...',
    '/financing': 'Loading financing options...',
    '/compare': 'Loading comparison...',
  };

  // Show loading on route changes
  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    // Set appropriate loading message
    const message = loadingMessages[pathname as keyof typeof loadingMessages] || 'Loading page...';
    setLoadingMessage(message);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    // Complete loading after a delay
    const completionTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimer);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center',
          'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {variant === 'bar' && (
          <div className="w-full max-w-md px-4">
            <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeClasses[size])}>
              <motion.div
                className={cn('h-full rounded-full', colorClasses[color as keyof typeof colorClasses])}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            {showProgress && (
              <motion.div
                className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {Math.round(progress)}%
              </motion.div>
            )}
          </div>
        )}

        {variant === 'spinner' && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2
              className={cn(
                'animate-spin',
                size === 'sm' && 'w-6 h-6',
                size === 'md' && 'w-8 h-8',
                size === 'lg' && 'w-12 h-12',
                `text-${color}-500`
              )}
            />
            {showMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</p>
            )}
          </motion.div>
        )}

        {variant === 'dots' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'rounded-full',
                    size === 'sm' && 'w-2 h-2',
                    size === 'md' && 'w-3 h-3',
                    size === 'lg' && 'w-4 h-4',
                    colorClasses[color as keyof typeof colorClasses]
                  )}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            {showMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</p>
            )}
          </div>
        )}

        {variant === 'car' && (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated car */}
            <div className="relative">
              <motion.div
                animate={{
                  x: [0, 20, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Car className="w-16 h-16 text-orange-500" />
              </motion.div>

              {/* Road lines */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-1 bg-orange-300 rounded"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>

            {showMessage && (
              <motion.p
                className="text-lg font-medium text-gray-700 dark:text-gray-300"
                animate={shouldReduceMotion ? {} : {
                  opacity: [0.7, 1, 0.7],
                }}
                transition={shouldReduceMotion ? {} : {
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                {loadingMessage}
              </motion.p>
            )}

            {showProgress && (
              <div className="w-64">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(progress)}%
                </div>
              </div>
            )}
          </motion.div>
        )}

        {variant === 'minimal' && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {showMessage && (
              <span className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</span>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Main page loading indicator with Suspense
export function PageLoadingIndicator(props: LoadingIndicatorProps) {
  return (
    <Suspense fallback={null}>
      <PageLoadingIndicatorInner {...props} />
    </Suspense>
  );
}

// Inner component for TopLoadingBar
function TopLoadingBarInner() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    const completionTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }, 600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimer);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      exit={{ width: '100%', opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
      }}
    />
  );
}

// Top loading bar with Suspense
export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}

// Loading skeleton for content
export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-gray-200 dark:bg-gray-700 rounded',
              i === lines - 1 && 'w-3/4' // Last line shorter
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Route transition indicator
export function RouteTransitionIndicator() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isTransitioning) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}