'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TouchGalleryProps {
  images: string[];
  alt: string;
  initialIndex?: number;
  showThumbnails?: boolean;
  showFullscreenButton?: boolean;
  className?: string;
  onImageChange?: (index: number) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
  threshold: number;
}

export default function TouchGallery({
  images,
  alt,
  initialIndex = 0,
  showThumbnails = true,
  showFullscreenButton = true,
  className = '',
  onImageChange
}: TouchGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    threshold: 50
  });

  const galleryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    onImageChange?.(nextIndex);
  }, [currentIndex, images.length, onImageChange]);

  const goToPrevious = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    onImageChange?.(prevIndex);
  }, [currentIndex, images.length, onImageChange]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    onImageChange?.(index);
  }, [onImageChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isDragging: true
    }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;

    // Prevent vertical scrolling if horizontal swipe is detected
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;

    setTouchState(prev => ({ ...prev, isDragging: false }));

    // Determine if this was a swipe gesture
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isQuickSwipe = deltaTime < 300;
    const isLongSwipe = Math.abs(deltaX) > touchState.threshold;

    if (isHorizontalSwipe && (isQuickSwipe || isLongSwipe)) {
      if (deltaX > 0) {
        // Swipe right (go to previous)
        goToPrevious();
      } else {
        // Swipe left (go to next)
        goToNext();
      }
    }
  }, [touchState, goToNext, goToPrevious]);

  // Mouse drag support for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setTouchState(prev => ({
      ...prev,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      isDragging: true
    }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchState.isDragging) return;
    e.preventDefault();
  }, [touchState.isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!touchState.isDragging) return;

    const deltaX = e.clientX - touchState.startX;
    const deltaTime = Date.now() - touchState.startTime;

    setTouchState(prev => ({ ...prev, isDragging: false }));

    const isQuickSwipe = deltaTime < 300;
    const isLongSwipe = Math.abs(deltaX) > touchState.threshold;

    if (isQuickSwipe || isLongSwipe) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  }, [touchState, goToNext, goToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            goToPrevious();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goToNext();
            break;
          case 'Escape':
            e.preventDefault();
            setIsFullscreen(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToNext, goToPrevious]);

  // Auto-play support (optional)
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (!touchState.isDragging && !isFullscreen) {
        goToNext();
      }
    }, 5000); // Auto advance every 5 seconds

    return () => clearInterval(interval);
  }, [images.length, touchState.isDragging, isFullscreen, goToNext]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const mainGalleryComponent = (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div
        ref={imageRef}
        className="relative aspect-[4/3] bg-gray-200 overflow-hidden rounded-lg select-none"
        style={{ minHeight: isFullscreen ? '70vh' : '400px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes={isFullscreen ? '100vw' : '(max-width: 768px) 100vw, 60vw'}
          priority={currentIndex === 0}
          draggable={false}
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Fullscreen Button */}
        {showFullscreenButton && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 bg-white/80 hover:bg-white shadow-lg"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        )}

        {/* Swipe indicator */}
        {touchState.isDragging && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="text-white text-sm font-medium">
              Swipe to navigate
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-[var(--primary-orange)] shadow-lg'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                width={80}
                height={64}
                className="object-cover w-full h-full"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Swipe instruction hint */}
      <div className="mt-2 text-center text-sm text-gray-500 md:hidden">
        Swipe left or right to navigate
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-60"
          onClick={() => setIsFullscreen(false)}
          aria-label="Close fullscreen"
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="w-full max-w-6xl">
          {mainGalleryComponent}
        </div>
      </div>
    );
  }

  return mainGalleryComponent;
}