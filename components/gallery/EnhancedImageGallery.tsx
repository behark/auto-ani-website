'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  Maximize2,
  Grid3X3,
  Play,
  Pause
} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface GalleryImage {
  asset: {
    url: string;
    metadata?: {
      dimensions?: { width: number; height: number };
      lqip?: string;
    };
  };
  alt?: string;
  caption?: string;
}

interface EnhancedImageGalleryProps {
  images: GalleryImage[];
  title: string;
  className?: string;
  autoPlay?: boolean;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  enableDownload?: boolean;
  enableShare?: boolean;
}

export default function EnhancedImageGallery({
  images = [],
  title,
  className = '',
  autoPlay = false,
  showThumbnails = true,
  enableZoom = true,
  enableFullscreen = true,
  enableDownload = true,
  enableShare = true
}: EnhancedImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-play functionality with improved cleanup
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && images.length > 1 && isMountedRef.current) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setCurrentIndex(prev => (prev + 1) % images.length);
        }
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, images.length]);

  // Navigation handlers - memoized to avoid unnecessary re-renders
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setZoomLevel(1);
    setRotation(0);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
    setRotation(0);
  }, [images.length]);

  // Keyboard navigation with improved cleanup
  useEffect(() => {
    if (!isFullscreen) return;

    const abortController = new AbortController();

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isMountedRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsFullscreen(false);
          // Clear interval when exiting fullscreen
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          break;
        case 'r':
        case 'R':
          setRotation(prev => prev + 90);
          break;
        case '+':
        case '=':
          setZoomLevel(prev => Math.min(prev + 0.5, 3));
          break;
        case '-':
          setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [isFullscreen, images.length, goToNext, goToPrevious]);

  if (!images || images.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const goToImage = useCallback((index: number) => {
    // Batch state updates for instant performance
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setZoomLevel(1);
    setRotation(0);
  }, [currentIndex]);

  const handleDownload = async () => {
    if (!isMountedRef.current) return;

    let objectUrl: string | null = null;
    try {
      const response = await fetch(currentImage.asset.url);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${title}-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      if (isMountedRef.current) {
        toast.error('Shkarkimi dështoi. Ju lutem provoni përsëri.');
      }
    } finally {
      // Always revoke the object URL to prevent memory leaks
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleShare = async () => {
    if (!isMountedRef.current) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Image ${currentIndex + 1}`,
          url: currentImage.asset.url,
        });
      } catch (_error) {
        // User cancelled or share failed, fallback to copying to clipboard
        if (isMountedRef.current && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(currentImage.asset.url);
            toast.success('URL-ja e fotos u kopjua në clipboard!');
          } catch {
            // Clipboard access denied
          }
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(currentImage.asset.url);
          if (isMountedRef.current) {
            toast.success('URL-ja e fotos u kopjua në clipboard!');
          }
        } catch (error) {
          console.error('Clipboard write failed:', error);
          if (isMountedRef.current) {
            toast.error('Kopjimi në clipboard dështoi.');
          }
        }
      }
    }
  };

  // Touch/Swipe handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger navigation

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - go to next image
        goToNext();
      } else {
        // Swiped right - go to previous image
        goToPrevious();
      }
    }

    // Reset touch positions
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <>
      <div className={`relative ${className}`} role="region" aria-label={`Galeria e fotografive për ${title}`}>
        {/* Screen reader announcements for image changes */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Foto {currentIndex + 1} nga {images.length}
          {currentImage.caption && `: ${currentImage.caption}`}
        </div>

        {/* Main Image Display */}
        <div className="space-y-4">
          {/* Main Image Container */}
          <div
            className="relative w-full rounded-lg overflow-hidden bg-gray-100 group"
            style={{ aspectRatio: '1/1' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
            src={currentImage.asset.url}
            alt={currentImage.alt || `${title} - Image ${currentIndex + 1}`}
            fill
            className={`object-cover ${zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease-out'
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 1000px"
            quality={process.env.NODE_ENV === 'development' ? 80 : 90}
            priority={true}
            loading="eager"
            fetchPriority="high"
            placeholder={currentImage.asset.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={currentImage.asset.metadata?.lqip}
            onClick={() => enableZoom && setZoomLevel(zoomLevel === 1 ? 2 : 1)}
            unoptimized={process.env.NODE_ENV === 'development' ? true : false}
          />

          {/* Preload adjacent images only (not all) for faster performance */}
          <div className="hidden">
            {/* Preload previous image */}
            {currentIndex > 0 && (
              <Image
                key={`preload-prev`}
                src={images[currentIndex - 1].asset.url}
                alt=""
                width={1000}
                height={1000}
                priority={true}
                loading="eager"
                quality={process.env.NODE_ENV === 'development' ? 75 : 85}
                unoptimized={process.env.NODE_ENV === 'development' ? true : false}
              />
            )}
            {/* Preload next image */}
            {currentIndex < images.length - 1 && (
              <Image
                key={`preload-next`}
                src={images[currentIndex + 1].asset.url}
                alt=""
                width={1000}
                height={1000}
                priority={true}
                loading="eager"
                quality={process.env.NODE_ENV === 'development' ? 75 : 85}
                unoptimized={process.env.NODE_ENV === 'development' ? true : false}
              />
            )}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm" aria-hidden="true">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Control Bar */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {enableFullscreen && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Fullscreen"
                aria-label="Hap foton në ekran të plotë"
              >
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {enableShare && (
              <button
                onClick={handleShare}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Share"
                aria-label="Shpërndaj foton"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {enableDownload && (
              <button
                onClick={handleDownload}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Download"
                aria-label="Shkarko foton"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                title="Previous image"
                aria-label={`Shko te foto e mëparshme (${currentIndex === 0 ? images.length : currentIndex} nga ${images.length})`}
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                title="Next image"
                aria-label={`Shko te foto tjetër (${currentIndex + 2 > images.length ? 1 : currentIndex + 2} nga ${images.length})`}
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Auto-play controls */}
            {images.length > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title={isPlaying ? "Pause slideshow" : "Start slideshow"}
                aria-label={isPlaying ? "Ndalo lojën automatike të fotove" : "Fillo lojën automatike të fotove"}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              </button>
            )}

            {/* Grid toggle */}
            {showThumbnails && images.length > 1 && (
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Toggle grid view"
                aria-label={showGrid ? "Mbyll pamjen e rrjetës së fotove" : "Hap pamjen e rrjetës së fotove"}
                aria-pressed={showGrid}
              >
                <Grid3X3 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Zoom controls */}
            {enableZoom && (
              <>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Zoom out"
                  aria-label={`Zvogëlo foton (${Math.round(zoomLevel * 100)}%)`}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Zoom in"
                  aria-label={`Zmadho foton (${Math.round(zoomLevel * 100)}%)`}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  onClick={() => setRotation(prev => prev + 90)}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Rotate"
                  aria-label={`Rrotullo foton 90 gradë (${rotation % 360}°)`}
                >
                  <RotateCw className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          {currentImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <p className="text-sm">{currentImage.caption}</p>
            </div>
          )}
          </div>

          {/* Horizontal Scrollable Thumbnail Row */}
          {showThumbnails && images.length > 1 && !showGrid && (
            <div className="relative group/thumbnails">
              {/* Left scroll button */}
              {images.length > 5 && (
                <button
                  onClick={() => {
                    const container = document.querySelector('.thumbnail-scroll-container');
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white shadow-lg rounded-full opacity-0 group-hover/thumbnails:opacity-100 transition-opacity"
                  aria-label="Scroll thumbnails left"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
              )}

              {/* Right scroll button */}
              {images.length > 5 && (
                <button
                  onClick={() => {
                    const container = document.querySelector('.thumbnail-scroll-container');
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white shadow-lg rounded-full opacity-0 group-hover/thumbnails:opacity-100 transition-opacity"
                  aria-label="Scroll thumbnails right"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              )}

              <div
                className="thumbnail-scroll-container flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                role="list"
                aria-label="Miniatura të fotove"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-100 ${
                      index === currentIndex
                        ? 'border-orange-500 ring-2 ring-orange-200 scale-105'
                        : 'border-gray-300 hover:border-orange-400 hover:scale-105'
                    }`}
                    onClick={() => goToImage(index)}
                    role="listitem"
                    aria-label={`Shfaq foton ${index + 1} nga ${images.length}`}
                    aria-current={index === currentIndex ? 'true' : 'false'}
                  >
                    <Image
                      src={image.asset.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 80px, 96px"
                      quality={85}
                      loading="eager"
                      priority={index < 10}
                      fetchPriority={index < 5 ? "high" : "auto"}
                    />
                  </button>
                ))}
              </div>

              {/* Scroll indicator hint - visible on mobile */}
              {images.length > 4 && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none md:hidden" />
              )}
            </div>
          )}
        </div>

        {/* Grid View */}
        {showGrid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {images.map((image, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative h-24 sm:h-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentIndex
                    ? 'border-orange-500 ring-2 ring-orange-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => {
                  goToImage(index);
                  setShowGrid(false);
                }}
              >
                <Image
                  src={image.asset.url}
                  alt={image.alt || `${title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  quality={80}
                  loading="lazy"
                  placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
                  blurDataURL={image.asset.metadata?.lqip}
                />

                {/* Image number overlay */}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Image Indicators */}
        {images.length > 1 && !showThumbnails && !showGrid && (
          <div className="flex justify-center mt-4 gap-2" role="list" aria-label="Indikatorët e fotove">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                role="listitem"
                aria-label={`Shko te foto ${index + 1} nga ${images.length}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Pamja në ekran të plotë e galerisë"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFullscreen(false);
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors z-10"
              aria-label="Mbyll pamjen në ekran të plotë (Escape)"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>

            {/* Fullscreen Controls */}
            <div className="absolute top-6 left-6 flex gap-2 z-10">
              {enableDownload && (
                <button
                  onClick={handleDownload}
                  className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Download"
                  aria-label="Shkarko foton"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                </button>
              )}

              {enableShare && (
                <button
                  onClick={handleShare}
                  className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Share"
                  aria-label="Shpërndaj foton"
                >
                  <Share2 className="w-5 h-5" aria-hidden="true" />
                </button>
              )}

              <button
                onClick={() => setRotation(prev => prev + 90)}
                className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Rotate"
                aria-label={`Rrotullo foton 90 gradë (tani ${rotation % 360}°)`}
              >
                <RotateCw className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Zoom Controls */}
            {enableZoom && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  disabled={zoomLevel <= 0.5}
                  aria-label={`Zvogëlo foton (tani ${Math.round(zoomLevel * 100)}%)`}
                >
                  <ZoomOut className="w-4 h-4" aria-hidden="true" />
                </button>

                <span className="px-3 py-2 bg-black/60 text-white rounded-full backdrop-blur-sm text-sm" aria-live="polite" aria-atomic="true">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  disabled={zoomLevel >= 3}
                  aria-label={`Zmadho foton (tani ${Math.round(zoomLevel * 100)}%)`}
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Navigation in Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  aria-label={`Foto e mëparshme (Shigjetë majtas)`}
                >
                  <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  aria-label={`Foto tjetër (Shigjetë djathtas)`}
                >
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </button>

                {/* Auto-play toggle */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute bottom-6 right-6 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  aria-label={isPlaying ? "Ndalo lojën automatike (Hapësirë)" : "Fillo lojën automatike (Hapësirë)"}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
                </button>
              </>
            )}

            {/* Fullscreen Main Image */}
            <div
              ref={imageRef}
              className="relative max-w-[90vw] max-h-[90vh] m-8"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={currentImage.asset.url}
                alt={currentImage.alt || `${title} - Image ${currentIndex + 1}`}
                width={currentImage.asset.metadata?.dimensions?.width || 1920}
                height={currentImage.asset.metadata?.dimensions?.height || 1280}
                className="object-contain w-full h-full"
                quality={process.env.NODE_ENV === 'development' ? 85 : 95}
                priority
                fetchPriority="high"
                unoptimized={process.env.NODE_ENV === 'development' ? true : false}
              />
            </div>

            {/* Fullscreen Caption */}
            {currentImage.caption && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-md text-center">
                <p className="text-white text-lg bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
                  {currentImage.caption}
                </p>
              </div>
            )}

            {/* Fullscreen Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 max-w-xs overflow-x-auto" role="list" aria-label="Navigimi me miniatura">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`relative w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-orange-500'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    role="listitem"
                    aria-label={`Shko te foto ${index + 1}`}
                    aria-current={index === currentIndex ? 'true' : 'false'}
                  >
                    <Image
                      src={image.asset.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      quality={75}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="absolute top-24 right-6 bg-black/80 text-white text-xs px-4 py-3 rounded-lg backdrop-blur-sm z-10" role="complementary" aria-label="Shkurtoret e tastierës">
              <div className="font-semibold mb-2">Shkurtoret e tastierës:</div>
              <div className="space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-300">← →</span>
                  <span>Navigim</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-300">+ −</span>
                  <span>Zoom</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-300">R</span>
                  <span>Rrotullim</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-300">Hapësirë</span>
                  <span>Play/Pause</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-300">Esc</span>
                  <span>Mbyll</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch/Swipe Support for Mobile */}
      <style jsx>{`
        .gallery-container {
          touch-action: pan-y;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  );
}