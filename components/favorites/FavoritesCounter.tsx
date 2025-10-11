'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FavoritesCounterProps {
  variant?: 'button' | 'icon' | 'text';
  showCount?: boolean;
  showZero?: boolean;
  className?: string;
  href?: string;
}

export default function FavoritesCounter({
  variant = 'button',
  showCount = true,
  showZero = false,
  className,
  href = '/favorites'
}: FavoritesCounterProps) {
  const { favoritesCount } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(favoritesCount);

  // Animate when count changes
  useEffect(() => {
    if (favoritesCount !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(favoritesCount);
      return () => clearTimeout(timer);
    }
  }, [favoritesCount, prevCount]);

  // Don't show if count is 0 and showZero is false
  if (favoritesCount === 0 && !showZero) {
    return null;
  }

  const content = (
    <div className={cn('relative inline-flex items-center', className)}>
      {variant === 'button' && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'transition-all duration-200 hover:text-[var(--primary-orange)]',
            isAnimating && 'scale-110'
          )}
        >
          <Heart className="h-5 w-5 mr-2" />
          Favorites
          {showCount && favoritesCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'ml-2 bg-[var(--primary-orange)] text-white text-xs',
                isAnimating && 'animate-bounce'
              )}
            >
              {favoritesCount}
            </Badge>
          )}
        </Button>
      )}

      {variant === 'icon' && (
        <div className={cn('relative', isAnimating && 'animate-pulse')}>
          <Heart className={cn(
            'h-6 w-6 text-gray-600 hover:text-[var(--primary-orange)] transition-colors',
            favoritesCount > 0 && 'text-[var(--primary-orange)]'
          )} />
          {showCount && favoritesCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs',
                'bg-red-500 text-white border-2 border-white',
                isAnimating && 'animate-bounce'
              )}
            >
              {favoritesCount > 99 ? '99+' : favoritesCount}
            </Badge>
          )}
        </div>
      )}

      {variant === 'text' && (
        <span className={cn(
          'text-sm text-gray-600 hover:text-[var(--primary-orange)] transition-colors',
          isAnimating && 'animate-pulse'
        )}>
          {favoritesCount} {favoritesCount === 1 ? 'favorite' : 'favorites'}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}