'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { MOTION_VARIANTS } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
};

const themeDescriptions = {
  light: 'Switch to light theme',
  dark: 'Switch to dark theme',
  system: 'Use system theme preference',
};

export function ThemeToggle({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('opacity-50', className)}
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  // Simple toggle variant (switches between light/dark only)
  if (variant === 'icon') {
    const CurrentIcon = themeIcons[effectiveTheme];

    return (
      <motion.div
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            'relative overflow-hidden transition-colors duration-300',
            'hover:bg-orange-100 dark:hover:bg-orange-900/20',
            className
          )}
          aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveTheme}
              initial={shouldReduceMotion ? {} : { rotate: -90, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { rotate: 0, opacity: 1 }}
              exit={shouldReduceMotion ? {} : { rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CurrentIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </motion.div>
          </AnimatePresence>

          {/* Animated background effect */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 rounded-md"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 0.1 }}
              transition={{ duration: 0.2 }}
              style={{
                background: `radial-gradient(circle, ${
                  effectiveTheme === 'light' ? '#f97316' : '#fbbf24'
                } 0%, transparent 70%)`,
              }}
            />
          )}
        </Button>
      </motion.div>
    );
  }

  // Button with label variant
  if (variant === 'button') {
    const CurrentIcon = themeIcons[effectiveTheme];

    return (
      <AnimatedButton
        variant="outline"
        animation="glow"
        onClick={toggleTheme}
        className={cn(
          'gap-2 transition-colors duration-300',
          'border-orange-200 hover:border-orange-300 dark:border-orange-800 dark:hover:border-orange-700',
          className
        )}
        icon={<CurrentIcon className="h-4 w-4" />}
      >
        {showLabel && (
          <span className="hidden sm:inline">
            {themeLabels[effectiveTheme]}
          </span>
        )}
      </AnimatedButton>
    );
  }

  // Dropdown variant (shows all theme options)
  if (variant === 'dropdown') {
    const CurrentIcon = themeIcons[theme]; // Use selected theme, not effective

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 transition-colors duration-300',
                'hover:bg-orange-100 dark:hover:bg-orange-900/20',
                className
              )}
            >
              <CurrentIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              {showLabel && (
                <span className="hidden sm:inline text-sm">
                  {themeLabels[theme]}
                </span>
              )}
            </Button>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme Selection
          </div>
          <DropdownMenuSeparator />

          {(Object.entries(themeIcons) as Array<[keyof typeof themeIcons, any]>).map(
            ([themeOption, Icon]) => (
              <DropdownMenuItem
                key={themeOption}
                onClick={() => setTheme(themeOption as any)}
                className={cn(
                  'gap-3 cursor-pointer transition-colors duration-200',
                  theme === themeOption && 'bg-orange-100 dark:bg-orange-900/30'
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{themeLabels[themeOption]}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {themeDescriptions[themeOption]}
                  </div>
                </div>
                {theme === themeOption && (
                  <motion.div
                    initial={shouldReduceMotion ? {} : { scale: 0 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    className="w-2 h-2 bg-orange-500 rounded-full"
                  />
                )}
              </DropdownMenuItem>
            )
          )}

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
            Current: {effectiveTheme === 'light' ? 'Light' : 'Dark'} mode
            {theme === 'system' && ' (Auto)'}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

// Floating theme toggle for fixed positioning
export function FloatingThemeToggle({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'bg-white dark:bg-gray-800',
        'rounded-full shadow-lg border border-gray-200 dark:border-gray-700',
        'p-2',
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <ThemeToggle variant="icon" />
    </motion.div>
  );
}

// Mini theme toggle for compact spaces
export function MiniThemeToggle({ className }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600',
        'transition-all duration-300 overflow-hidden relative',
        'hover:border-orange-400 dark:hover:border-orange-500',
        className
      )}
      whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          backgroundColor: effectiveTheme === 'light' ? '#ffffff' : '#1f2937',
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-3 h-3 rounded-full"
          animate={{
            backgroundColor: effectiveTheme === 'light' ? '#f59e0b' : '#fbbf24',
            x: effectiveTheme === 'light' ? -6 : 6,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.button>
  );
}

// Theme indicator component
export function ThemeIndicator({ className }: { className?: string }) {
  const { theme, effectiveTheme } = useTheme();

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          effectiveTheme === 'light' ? 'bg-yellow-400' : 'bg-blue-400'
        )}
      />
      <span>
        {effectiveTheme === 'light' ? 'Light' : 'Dark'} mode
        {theme === 'system' && ' (Auto)'}
      </span>
    </div>
  );
}