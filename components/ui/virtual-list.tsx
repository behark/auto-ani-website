'use client';

import { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (props: { index: number; style: any; data: any }) => React.ReactNode;
  className?: string;
  overscan?: number;
}

// Simple fallback implementation without react-window
export const VirtualList = forwardRef<HTMLDivElement, VirtualListProps>(
  ({ items, itemHeight, height, renderItem, className, overscan = 5 }, ref) => {
    const itemData = useMemo(() => ({ items, renderItem }), [items, renderItem]);

    return (
      <div
        ref={ref}
        className={cn('overflow-auto', className)}
        style={{ height }}
      >
        {items.map((item, index) => {
          const style = {
            height: itemHeight,
            minHeight: itemHeight,
          };
          return (
            <div key={index} style={style}>
              {renderItem({ index, style, data: item })}
            </div>
          );
        })}
      </div>
    );
  }
);

VirtualList.displayName = 'VirtualList';

export default VirtualList;