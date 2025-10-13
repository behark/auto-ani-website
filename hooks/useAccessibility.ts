'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Custom hook for managing focus
export function useFocusManagement() {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback((element: HTMLElement) => {
    const focusableContent = element.querySelectorAll(focusableElements);
    const firstFocusable = focusableContent[0] as HTMLElement;
    const lastFocusable = focusableContent[focusableContent.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const focusableContent = document.querySelectorAll(focusableElements);
    const currentIndex = Array.from(focusableContent).indexOf(document.activeElement as HTMLElement);

    let targetIndex: number;
    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % focusableContent.length;
        break;
      case 'previous':
        targetIndex = currentIndex <= 0 ? focusableContent.length - 1 : currentIndex - 1;
        break;
      case 'first':
        targetIndex = 0;
        break;
      case 'last':
        targetIndex = focusableContent.length - 1;
        break;
      default:
        return;
    }

    (focusableContent[targetIndex] as HTMLElement)?.focus();
  }, []);

  return { trapFocus, moveFocus };
}

// Custom hook for screen reader announcements
export function useScreenReader() {
  const announcer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('aria-relevant', 'text');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    announcer.current = liveRegion;

    return () => {
      if (announcer.current) {
        document.body.removeChild(announcer.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcer.current) {
      announcer.current.setAttribute('aria-live', priority);
      announcer.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (announcer.current) {
          announcer.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
}

// Custom hook for keyboard navigation
export function useKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (onEnter && (e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('up');
        }
        break;
      case 'ArrowDown':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('down');
        }
        break;
      case 'ArrowLeft':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('left');
        }
        break;
      case 'ArrowRight':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('right');
        }
        break;
    }
  }, [onEnter, onEscape, onArrowKeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
}

// Custom hook for reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Custom hook for high contrast mode
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

// Custom hook for form accessibility
export function useFormAccessibility() {
  const validateField = useCallback((
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: string) => string | null;
    }
  ) => {
    const value = element.value;
    const errors: string[] = [];

    if (rules.required && !value.trim()) {
      errors.push('This field is required');
    }

    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters`);
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push('Invalid format');
    }

    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    // Update ARIA attributes
    if (errors.length > 0) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', `${element.id}-error`);
    } else {
      element.setAttribute('aria-invalid', 'false');
      element.removeAttribute('aria-describedby');
    }

    return errors;
  }, []);

  const announceFormErrors = useCallback((errors: Record<string, string[]>) => {
    const errorCount = Object.values(errors).flat().length;
    if (errorCount > 0) {
      const message = `Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct.`;
      // This would use the screen reader announce function
      setTimeout(() => {
        const announcer = document.querySelector('[aria-live]');
        if (announcer) {
          announcer.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { validateField, announceFormErrors };
}

// Custom hook for skip links
export function useSkipLinks() {
  useEffect(() => {
    // Create skip links if they don't exist
    const existingSkipLinks = document.querySelector('.skip-links');
    if (!existingSkipLinks) {
      const skipLinks = document.createElement('div');
      skipLinks.className = 'skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
        <a href="#footer" class="skip-link">Skip to footer</a>
      `;

      // Style skip links
      const style = document.createElement('style');
      style.textContent = `
        .skip-links {
          position: fixed;
          top: -100px;
          left: 0;
          z-index: 1000;
        }
        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 0 0 4px 0;
          transform: translateY(-100%);
          transition: transform 0.2s ease;
        }
        .skip-link:focus {
          transform: translateY(100px);
        }
      `;

      document.head.appendChild(style);
      document.body.insertBefore(skipLinks, document.body.firstChild);
    }
  }, []);
}

// Custom hook for color contrast checking
export function useColorContrast() {
  const checkContrast = useCallback((foreground: string, background: string) => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return null;

    const fgLum = getLuminance(fg.r, fg.g, fg.b);
    const bgLum = getLuminance(bg.r, bg.g, bg.b);

    const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

    return {
      ratio: contrast,
      AA: contrast >= 4.5,
      AAA: contrast >= 7,
      level: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Fail'
    };
  }, []);

  return { checkContrast };
}

// Main accessibility hook that combines all features
export function useAccessibility() {
  const { announce } = useScreenReader();
  const { trapFocus, moveFocus } = useFocusManagement();
  const { validateField, announceFormErrors } = useFormAccessibility();
  const { checkContrast } = useColorContrast();
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();

  useSkipLinks();

  return {
    announce,
    trapFocus,
    moveFocus,
    validateField,
    announceFormErrors,
    checkContrast,
    prefersReducedMotion,
    prefersHighContrast
  };
}