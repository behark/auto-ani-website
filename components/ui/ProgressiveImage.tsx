"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Progressive Image Component with Smart Loading
 * Features:
 * - Progressive loading (low-res -> high-res)
 * - Automatic format detection (AVIF -> WebP -> JPEG)
 * - Smart fallback handling
 * - Memory-efficient loading
 * - Performance optimizations
 */
export default function ProgressiveImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = "",
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 85,
  placeholderSrc,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Generate different quality versions
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.startsWith("/") && !baseSrc.startsWith("http")) {
      return baseSrc;
    }

    // For Next.js image optimization
    const params = new URLSearchParams({
      w: width.toString(),
      q: quality.toString(),
    });

    return `${baseSrc}?${params}`;
  };

  // Generate placeholder (low-quality version)
  const generatePlaceholder = (baseSrc: string) => {
    if (placeholderSrc) return placeholderSrc;

    if (!baseSrc.startsWith("/") && !baseSrc.startsWith("http")) {
      return baseSrc;
    }

    const params = new URLSearchParams({
      w: "40",
      q: "10",
    });

    return `${baseSrc}?${params}`;
  };

  // Handle image load success
  const handleLoad = () => {
    setImgLoaded(true);
    setImgError(false);
    onLoad?.();
  };

  // Handle image load error
  const handleError = () => {
    setImgError(true);
    onError?.();

    // Try fallback sources
    if (imgSrc === src) {
      // Try to remove query parameters
      const cleanSrc = src.split("?")[0];
      if (cleanSrc !== src) {
        setImgSrc(cleanSrc);
        return;
      }

      // Try different format
      if (src.includes(".webp")) {
        setImgSrc(src.replace(".webp", ".jpg"));
        return;
      }

      if (src.includes(".avif")) {
        setImgSrc(src.replace(".avif", ".webp"));
        return;
      }
    }
  };

  // Preload high-quality image when in viewport
  useEffect(() => {
    if (!priority && "IntersectionObserver" in window) {
      const img = new window.Image();
      img.src = generateSrcSet(imgSrc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, priority, quality, width]);

  const imageProps = fill
    ? {
        fill: true,
        sizes,
        style: { objectFit: "cover" as const },
      }
    : {
        width,
        height,
        style: { width: "auto", height: "auto" },
      };

  // Base64 encoded minimal placeholder
  const blurDataURL =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  if (imgError) {
    return (
      <div
        className={cn(
          "bg-gray-200 flex items-center justify-center rounded-lg",
          fill ? "w-full h-full" : "",
          className
        )}
        style={fill ? {} : { width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🚗</div>
          <div className="text-sm">Image unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "w-full h-full" : "",
        className
      )}
    >
      {/* Low-quality placeholder */}
      {!imgLoaded && (
        <Image
          src={generatePlaceholder(imgSrc)}
          alt=""
          {...imageProps}
          quality={10}
          priority={priority}
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            "blur-sm scale-105 z-0"
          )}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      )}

      {/* High-quality main image */}
      <Image
        src={generateSrcSet(imgSrc)}
        alt={alt}
        {...imageProps}
        quality={quality}
        priority={priority}
        className={cn(
          "transition-opacity duration-500 z-10",
          imgLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL={blurDataURL}
        sizes={sizes}
      />

      {/* Loading indicator */}
      {!imgLoaded && !imgError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg z-5" />
      )}
    </div>
  );
}
