'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render outside the visible area
  className?: string;
  horizontal?: boolean; // Support for horizontal scrolling
  gap?: number; // Gap between items
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 2,
  className = '',
  horizontal = false,
  gap = 0,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible range
  const itemHeightWithGap = itemHeight + gap;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeightWithGap) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeightWithGap) + overscan
  );

  // Calculate total height/width
  const totalSize = items.length * itemHeightWithGap - gap;

  // Debounced scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return;

    const currentScrollTop = horizontal
      ? scrollElementRef.current.scrollLeft
      : scrollElementRef.current.scrollTop;

    // Throttle scroll updates for better performance
    if (Math.abs(currentScrollTop - lastScrollTopRef.current) > 5) {
      lastScrollTopRef.current = currentScrollTop;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new scroll position with debounce
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollTop(currentScrollTop);
      }, 10);
    }
  }, [horizontal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Visible items to render
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex && i < items.length; i++) {
    const style: React.CSSProperties = horizontal
      ? {
          position: 'absolute',
          left: `${i * itemHeightWithGap}px`,
          width: `${itemHeight}px`,
          height: '100%',
        }
      : {
          position: 'absolute',
          top: `${i * itemHeightWithGap}px`,
          height: `${itemHeight}px`,
          width: '100%',
        };

    visibleItems.push(
      <div key={i} style={style}>
        {renderItem(items[i], i)}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`relative overflow-auto ${className}`}
      style={{
        height: horizontal ? '100%' : `${containerHeight}px`,
        width: horizontal ? '100%' : 'auto',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: horizontal ? '100%' : `${totalSize}px`,
          width: horizontal ? `${totalSize}px` : '100%',
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

// Optimized virtualized image gallery
interface VirtualizedGalleryProps {
  images: string[];
  thumbnailHeight?: number;
  className?: string;
  onImageClick?: (index: number) => void;
}

export function VirtualizedGallery({
  images,
  thumbnailHeight = 100,
  className = '',
  onImageClick,
}: VirtualizedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const renderThumbnail = useCallback(
    (src: string, index: number) => (
      <div
        className="relative cursor-pointer overflow-hidden rounded-md transition-transform hover:scale-105"
        onClick={() => onImageClick?.(index)}
        style={{ height: `${thumbnailHeight}px` }}
      >
        <img
          src={src}
          alt={`Thumbnail ${index + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    ),
    [thumbnailHeight, onImageClick]
  );

  return (
    <div ref={containerRef} className={`h-full ${className}`}>
      <VirtualizedList
        items={images}
        itemHeight={thumbnailHeight}
        containerHeight={containerHeight}
        renderItem={renderThumbnail}
        gap={8}
        overscan={3}
      />
    </div>
  );
}

// Horizontal virtualized list for thumbnails
interface VirtualizedThumbnailsProps {
  images: { url: string; alt?: string }[];
  thumbnailWidth?: number;
  containerWidth?: number;
  selectedIndex?: number;
  onThumbnailClick?: (index: number) => void;
  className?: string;
}

export function VirtualizedThumbnails({
  images,
  thumbnailWidth = 120,
  containerWidth = 800,
  selectedIndex = 0,
  onThumbnailClick,
  className = '',
}: VirtualizedThumbnailsProps) {
  const renderThumbnail = useCallback(
    (image: { url: string; alt?: string }, index: number) => (
      <button
        className={`relative overflow-hidden rounded-md transition-all ${
          selectedIndex === index
            ? 'ring-2 ring-orange-500 scale-105'
            : 'hover:opacity-80'
        }`}
        onClick={() => onThumbnailClick?.(index)}
        style={{ width: `${thumbnailWidth}px`, height: `${thumbnailWidth * 0.75}px` }}
      >
        <img
          src={image.url}
          alt={image.alt || `Thumbnail ${index + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </button>
    ),
    [thumbnailWidth, selectedIndex, onThumbnailClick]
  );

  return (
    <div className={`w-full ${className}`}>
      <VirtualizedList
        items={images}
        itemHeight={thumbnailWidth}
        containerHeight={thumbnailWidth * 0.75 + 20} // Height + padding
        renderItem={renderThumbnail}
        horizontal={true}
        gap={8}
        overscan={2}
      />
    </div>
  );
}