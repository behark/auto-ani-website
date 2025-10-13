'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
  onIntersect?: (entry: IntersectionObserverEntry) => void;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
    onIntersect
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.IntersectionObserver) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyIntersecting = entry.isIntersecting;

          setIsIntersecting(isCurrentlyIntersecting);

          if (isCurrentlyIntersecting) {
            setHasIntersected(true);
            onIntersect?.(entry);

            if (triggerOnce && observerRef.current) {
              observerRef.current.unobserve(element);
            }
          }
        });
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce, onIntersect]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    isVisible: triggerOnce ? hasIntersected : isIntersecting
  };
}