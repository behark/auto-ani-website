'use client';

import { useEffect } from 'react';

interface LCPPreloaderProps {
  imageUrl?: string;
  priority?: boolean;
}

export default function LCPPreloader({ imageUrl, priority = true }: LCPPreloaderProps) {
  useEffect(() => {
    if (!imageUrl || !priority) return;

    // Preload the LCP image for faster loading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageUrl;
    link.type = 'image/webp';
    link.setAttribute('fetchpriority', 'high');

    // Add responsive preloading
    if (imageUrl.includes('cdn.sanity.io')) {
      // For Sanity images, preload multiple sizes
      const sizes = [
        { media: '(max-width: 640px)', width: 640 },
        { media: '(max-width: 1024px)', width: 1024 },
        { media: '(min-width: 1025px)', width: 1440 }
      ];

      sizes.forEach(({ media, width }) => {
        const responsiveLink = document.createElement('link');
        responsiveLink.rel = 'preload';
        responsiveLink.as = 'image';
        responsiveLink.href = `${imageUrl}?w=${width}&q=90&fm=webp`;
        responsiveLink.media = media;
        responsiveLink.setAttribute('fetchpriority', 'high');
        document.head.appendChild(responsiveLink);
      });
    } else {
      document.head.appendChild(link);
    }

    return () => {
      // Cleanup on unmount
      const links = document.head.querySelectorAll('link[rel="preload"][as="image"]');
      links.forEach(link => {
        if (link.getAttribute('href')?.includes(imageUrl)) {
          link.remove();
        }
      });
    };
  }, [imageUrl, priority]);

  return null;
}