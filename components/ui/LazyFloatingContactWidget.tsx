'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Lazy load the FloatingContactWidget only when user scrolls or after delay
const FloatingContactWidget = dynamic(() => import('./FloatingContactWidget'), {
  ssr: false, // Don't render on server to save resources
  loading: () => null, // No loading indicator for seamless experience
});

export default function LazyFloatingContactWidget() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Load after 3 seconds or when user scrolls, whichever comes first
    const timer = setTimeout(() => setShouldLoad(true), 3000);

    const handleScroll = () => {
      setShouldLoad(true);
      window.removeEventListener('scroll', handleScroll);
    };

    window.addEventListener('scroll', handleScroll, { once: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!shouldLoad) return null;

  return <FloatingContactWidget />;
}