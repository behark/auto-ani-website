'use client';

import { Vehicle } from '@/lib/types';
import { useCallback, useEffect, useRef, useState, memo } from 'react';
import OptimizedVehicleCard from './OptimizedVehicleCard';

interface VirtualizedVehicleListProps {
  vehicles: Vehicle[];
  viewMode?: 'grid' | 'list';
  itemHeight?: number;
  overscan?: number;
  className?: string;
}

const VirtualizedVehicleList = memo(function VirtualizedVehicleList({
  vehicles,
  viewMode = 'grid',
  itemHeight = 400,
  overscan = 3,
  className = ''
}: VirtualizedVehicleListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate columns based on view mode
  const columns = viewMode === 'grid' ?
    (typeof window !== 'undefined' ?
      (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1) : 3
    ) : 1;

  const rowCount = Math.ceil(vehicles.length / columns);
  const totalHeight = rowCount * itemHeight;

  // Calculate visible items based on scroll position
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;

    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endRow = Math.min(
      rowCount - 1,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan
    );

    const start = startRow * columns;
    const end = Math.min(vehicles.length, (endRow + 1) * columns);

    setVisibleRange({ start, end });
  }, [itemHeight, overscan, rowCount, columns, vehicles.length]);

  // Handle scroll with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateVisibleRange, 10);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });

      // Initial calculation
      calculateVisibleRange();

      // Set container height
      setContainerHeight(container.clientHeight);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(timeoutId);
    };
  }, [calculateVisibleRange]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      calculateVisibleRange();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateVisibleRange]);

  // Render visible items
  const visibleItems = vehicles.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          className={viewMode === 'grid' ?
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
            'space-y-4'
          }
          style={{
            transform: `translateY(${Math.floor(visibleRange.start / columns) * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((vehicle, index) => (
            <OptimizedVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              viewMode={viewMode}
              index={visibleRange.start + index}
              eager={visibleRange.start + index < 4}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default VirtualizedVehicleList;