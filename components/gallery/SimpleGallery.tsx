'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface SimpleGalleryProps {
  images: string[];
  alt?: string;
}

/**
 * ✅ Simplified Image Gallery Component
 *
 * Replaces EnhancedImageGallery (588 lines → 120 lines)
 *
 * Features:
 * - Grid view with click to expand
 * - Lightbox with keyboard navigation
 * - Previous/Next controls
 * - Optimized images at every stage
 */
export default function SimpleGallery({ images, alt = 'Gallery image' }: SimpleGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeLightbox();
  };

  return (
    <>
      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-video cursor-pointer overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => openLightbox(index)}
          >
            <OptimizedImage
              src={image}
              alt={`${alt} ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Current Image */}
          <div
            className="relative max-w-7xl max-h-[90vh] mx-auto px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <OptimizedImage
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              width={1600}
              height={1200}
              className="object-contain max-h-[90vh]"
              priority
              showPlaceholder={false}
            />
            <p className="text-white text-center mt-4">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight size={48} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
