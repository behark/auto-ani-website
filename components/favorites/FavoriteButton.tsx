'use client';

import { useState } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Vehicle } from '@/lib/types';

interface FavoriteButtonProps {
  vehicle: Vehicle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  showText?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function FavoriteButton({
  vehicle,
  size = 'md',
  variant = 'default',
  showText = false,
  className,
  onClick
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const isFav = isFavorite(vehicle.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Toggle favorite
    toggleFavorite(vehicle);

    // Call custom onClick if provided
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return isFav
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg border-0'
          : 'bg-white/90 backdrop-blur hover:bg-white text-gray-600 shadow-lg border-0';
      case 'outline':
        return isFav
          ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:text-red-500';
      case 'ghost':
        return isFav
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-600 hover:text-red-500 hover:bg-gray-50';
      default:
        return isFav
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-red-500';
    }
  };

  if (showText) {
    return (
      <Button
        onClick={handleClick}
        variant={variant === 'floating' ? 'default' : variant}
        size={size === 'md' ? 'default' : size === 'sm' ? 'sm' : 'lg'}
        className={cn(
          'transition-all duration-200',
          getVariantClasses(),
          isAnimating && 'scale-110',
          className
        )}
      >
        <Heart
          className={cn(
            iconSizes[size],
            'mr-2 transition-all duration-200',
            isFav && 'fill-current',
            isAnimating && 'scale-125'
          )}
        />
        {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant === 'floating' ? 'default' : variant}
      size={size === 'md' ? 'default' : size}
      className={cn(
        'transition-all duration-200',
        sizeClasses[size],
        getVariantClasses(),
        isAnimating && 'scale-110',
        'rounded-full p-0',
        className
      )}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? (
        <Heart
          className={cn(
            iconSizes[size],
            'fill-current transition-all duration-200',
            isAnimating && 'scale-125'
          )}
        />
      ) : (
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all duration-200',
            isAnimating && 'scale-125'
          )}
        />
      )}
    </Button>
  );
}