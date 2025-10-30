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

  const intervalRef = useRef<NodeJS.Timeout>();
  const imageRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 4000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
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

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsFullscreen(false);
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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Image ${currentIndex + 1}`,
          url: currentImage.asset.url,
        });
      } catch (_error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(currentImage.asset.url);
        toast.success('Image URL copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(currentImage.asset.url);
      toast.success('Image URL copied to clipboard!');
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image Display */}
        <div className="space-y-4">
          {/* Main Image Container */}
          <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden bg-gray-100 group">
            <Image
            src={currentImage.asset.url}
            alt={currentImage.alt || `${title} - Image ${currentIndex + 1}`}
            fill
            className={`object-cover transition-transform duration-300 ${zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
            quality={90}
            priority={currentIndex === 0}
            placeholder={currentImage.asset.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={currentImage.asset.metadata?.lqip}
            onClick={() => enableZoom && setZoomLevel(zoomLevel === 1 ? 2 : 1)}
          />

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Control Bar */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {enableFullscreen && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {enableShare && (
              <button
                onClick={handleShare}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {enableDownload && (
              <button
                onClick={handleDownload}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
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
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
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
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}

            {/* Grid toggle */}
            {showThumbnails && images.length > 1 && (
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Toggle grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            )}

            {/* Zoom controls */}
            {enableZoom && (
              <>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Zoom out"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Zoom in"
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setRotation(prev => prev + 90)}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
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

          {/* Simple Thumbnail Grid Below Main Image */}
          {showThumbnails && images.length > 1 && !showGrid && (
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-video rounded overflow-hidden cursor-pointer border transition-all ${
                    index === currentIndex
                      ? 'border-orange-500'
                      : 'border-gray-300 hover:border-orange-400'
                  }`}
                  onClick={() => goToImage(index)}
                >
                  <Image
                    src={image.asset.url}
                    alt={image.alt || `${title} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                    quality={60}
                  />
                </div>
              ))}
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
                  quality={70}
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
          <div className="flex justify-center mt-4 gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
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
            >
              <X className="w-6 h-6" />
            </button>

            {/* Fullscreen Controls */}
            <div className="absolute top-6 left-6 flex gap-2 z-10">
              {enableDownload && (
                <button
                  onClick={handleDownload}
                  className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}

              {enableShare && (
                <button
                  onClick={handleShare}
                  className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setRotation(prev => prev + 90)}
                className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            {/* Zoom Controls */}
            {enableZoom && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-3 py-2 bg-black/60 text-white rounded-full backdrop-blur-sm text-sm">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                  className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Navigation in Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Auto-play toggle */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute bottom-6 right-6 p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
            >
              <Image
                src={currentImage.asset.url}
                alt={currentImage.alt || `${title} - Image ${currentIndex + 1}`}
                width={currentImage.asset.metadata?.dimensions?.width || 1200}
                height={currentImage.asset.metadata?.dimensions?.height || 800}
                className="object-contain w-full h-full"
                quality={95}
                priority
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
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 max-w-xs overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`relative w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-orange-500'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={image.asset.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      quality={50}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch/Swipe Support for Mobile */}
      <style jsx>{`
        .gallery-container {
          touch-action: pan-y;
        }
      `}</style>
    </>
  );
}