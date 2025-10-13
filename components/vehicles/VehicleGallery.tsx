'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Download, Share2 } from 'lucide-react';
import { useState, useCallback } from 'react';

import { cn } from '@/lib/utils';

import VehicleImage from './VehicleImage';


interface VehicleGalleryProps {
  images: (string | null | undefined)[];
  vehicleName: string;
  className?: string;
  showThumbnails?: boolean;
  enableDownload?: boolean;
  enableShare?: boolean;
  priority?: boolean;
}

/**
 * Advanced Vehicle Gallery Component
 * Handles multiple vehicle images with robust fallback system
 * Features: fullscreen modal, thumbnails, download, share
 */
export default function VehicleGallery({
  images,
  vehicleName,
  className,
  showThumbnails = true,
  enableDownload = false,
  enableShare = false,
  priority = false
}: VehicleGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

  // Filter out null/undefined images and ensure fallbacks
  const validImages = images.map(img => img || '/images/placeholder-vehicle.svg');
  const currentImage = validImages[currentIndex] || '/images/placeholder-vehicle.svg';

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length]);

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < validImages.length) {
      setCurrentIndex(index);
    }
  }, [validImages.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case 'Escape':
        setIsModalOpen(false);
        break;
    }
  }, [goToPrevious, goToNext]);

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!enableDownload || !currentImage) return;

    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vehicleName}-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to download image:', error);
    }
  }, [currentImage, vehicleName, currentIndex, enableDownload]);

  const handleShare = useCallback(async () => {
    if (!enableShare || !navigator.share) return;

    try {
      await navigator.share({
        title: `${vehicleName} - Image ${currentIndex + 1}`,
        text: `Check out this image of ${vehicleName}`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard?.writeText(window.location.href);
    }
  }, [vehicleName, currentIndex, enableShare]);

  if (validImages.length === 0) {
    return (
      <div className={cn('relative aspect-video bg-gray-100 rounded-lg overflow-hidden', className)}>
        <VehicleImage
          src="/images/placeholder-vehicle.svg"
          alt={`${vehicleName} placeholder`}
          fill
          priority={priority}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Main Image */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
          <VehicleImage
            src={currentImage}
            alt={`${vehicleName} - Image ${currentIndex + 1}`}
            fill
            priority={priority && currentIndex === 0}
            onLoad={() => handleImageLoad(currentIndex)}
            onError={() => handleImageError(currentIndex)}
          />

          {/* Loading overlay */}
          {imageLoading[currentIndex] && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">Loading...</div>
            </div>
          )}

          {/* Navigation arrows */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
              aria-label="View fullscreen"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            {enableDownload && (
              <button
                onClick={handleDownload}
                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {enableShare && typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                aria-label="Share image"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Image counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && validImages.length > 1 && (
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <VehicleImage
                  src={image}
                  alt={`${vehicleName} thumbnail ${index + 1}`}
                  fill
                  containerSize="small"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
            onKeyDown={(e) => handleKeyDown(e.nativeEvent)}
            tabIndex={0}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              aria-label="Close fullscreen"
            >
              <X className="h-8 w-8" />
            </button>

            <div
              className="relative max-w-7xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <VehicleImage
                src={currentImage}
                alt={`${vehicleName} - Image ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />

              {/* Modal navigation */}
              {validImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Modal counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded">
                {currentIndex + 1} / {validImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Utility functions for gallery management
export const prepareGalleryImages = (images: (string | null | undefined)[]): string[] => {
  return images
    .filter((img): img is string => Boolean(img))
    .map(img => img || '/images/placeholder-vehicle.svg');
};

export const validateGalleryImages = async (images: string[]): Promise<string[]> => {
  const validatedImages: string[] = [];

  for (const image of images) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = image;
      });
      validatedImages.push(image);
    } catch {
      validatedImages.push('/images/placeholder-vehicle.svg');
    }
  }

  return validatedImages;
};