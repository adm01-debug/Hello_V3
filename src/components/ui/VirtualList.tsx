import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  height?: string | number;
  className?: string;
  overscan?: number;
  keyExtractor?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({ 
  items, 
  renderItem, 
  estimateSize = 50,
  height = '400px',
  className,
  overscan = 5,
  keyExtractor,
  onScroll
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div 
      ref={parentRef} 
      className={cn("overflow-auto relative scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20", className)}
      style={{ height }}
      onScroll={(e) => onScroll?.(e.currentTarget.scrollTop)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = keyExtractor ? keyExtractor(item, virtualItem.index) : virtualItem.key;
          
          return (
            <div
              key={key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

