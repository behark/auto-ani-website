/**
 * Image Optimization Utilities for AUTO ANI
 * Handles Sanity image transformations, lazy loading, and performance optimization
 */

interface SanityImageAsset {
  _ref?: string;
  _type?: string;
  asset?: {
    url: string;
    metadata?: {
      dimensions?: { width: number; height: number };
      lqip?: string;
    };
  };
  url?: string;
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  blur?: boolean;
  placeholder?: string;
}

export class ImageOptimizer {
  private static readonly SANITY_PROJECT_ID = 'j2t31xge';
  private static readonly SANITY_DATASET = 'production';

  /**
   * Generate optimized Sanity image URL with transformations
   */
  static generateSanityImageUrl(
    imageRef: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
      crop?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'focalpoint';
      blur?: number;
    } = {}
  ): string {
    const {
      width,
      height,
      quality = 80,
      format = 'auto',
      fit = 'crop',
      crop = 'center',
      blur
    } = options;

    // Clean image reference (remove sanity:// prefix if present)
    const cleanRef = imageRef.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp');

    let url = `https://cdn.sanity.io/images/${this.SANITY_PROJECT_ID}/${this.SANITY_DATASET}/${cleanRef}`;

    const params: string[] = [];

    if (width) params.push(`w=${width}`);
    if (height) params.push(`h=${height}`);
    if (quality) params.push(`q=${quality}`);
    if (format && format !== 'auto') params.push(`fm=${format}`);
    if (fit) params.push(`fit=${fit}`);
    if (crop) params.push(`crop=${crop}`);
    if (blur) params.push(`blur=${blur}`);

    // Always add auto format for modern browsers
    if (!params.find(p => p.startsWith('fm='))) {
      params.push('auto=format');
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  }

  /**
   * Generate responsive image srcSet for different screen sizes
   */
  static generateResponsiveSrcSet(imageUrl: string, _baseName: string): string {
    const sizes = [640, 750, 828, 1080, 1200, 1920];

    return sizes.map(size => {
      const optimizedUrl = this.generateSanityImageUrl(imageUrl, {
        width: size,
        quality: size > 1200 ? 75 : 80,
        format: 'auto'
      });
      return `${optimizedUrl} ${size}w`;
    }).join(', ');
  }

  /**
   * Generate optimized image for different use cases
   */
  static getOptimizedImageProps(
    image: SanityImageAsset | string,
    useCase: 'hero' | 'card' | 'thumbnail' | 'gallery' | 'fullscreen'
  ): OptimizedImageProps {
    const imageUrl = typeof image === 'string'
      ? image
      : image.asset?.url || image.url || '';

    const lqip = typeof image !== 'string' && image.asset?.metadata?.lqip;

    const configs = {
      hero: {
        width: 1200,
        height: 600,
        quality: 90,
        format: 'auto' as const
      },
      card: {
        width: 400,
        height: 250,
        quality: 80,
        format: 'auto' as const
      },
      thumbnail: {
        width: 100,
        height: 100,
        quality: 70,
        format: 'auto' as const
      },
      gallery: {
        width: 800,
        height: 600,
        quality: 85,
        format: 'auto' as const
      },
      fullscreen: {
        width: 1920,
        height: 1080,
        quality: 95,
        format: 'auto' as const
      }
    };

    const config = configs[useCase];

    return {
      src: imageUrl,
      alt: '',
      ...config,
      placeholder: lqip || undefined
    };
  }

  /**
   * Preload critical images
   */
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Generate image sizes attribute for responsive images
   */
  static generateSizesAttribute(useCase: 'hero' | 'card' | 'gallery'): string {
    switch (useCase) {
      case 'hero':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px';
      case 'card':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px';
      case 'gallery':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px';
      default:
        return '100vw';
    }
  }

  /**
   * Check if image format is supported by browser
   */
  static supportsWebP(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);

    return new Promise((resolve) => {
      const webP = new window.Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Generate optimized image URL for vehicle cards
   */
  static getVehicleCardImage(
    image: SanityImageAsset | string,
    options: { width?: number; height?: number } = {}
  ): string {
    const { width = 400, height = 250 } = options;

    if (typeof image === 'string') {
      // If already a URL, try to add Sanity optimizations if it's a Sanity image
      if (image.includes('cdn.sanity.io')) {
        return `${image}?w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=80`;
      }
      return image;
    }

    const imageUrl = image.asset?.url || image.url || '';

    if (imageUrl.includes('cdn.sanity.io')) {
      return `${imageUrl}?w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=80`;
    }

    return imageUrl;
  }

  /**
   * Generate placeholder for loading states
   */
  static generatePlaceholder(width: number, height: number, text?: string): string {
    const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return '';

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Text
      if (text) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);
      }
    }

    return canvas.toDataURL('image/png');
  }
}

// Export convenience functions
export const {
  generateSanityImageUrl,
  generateResponsiveSrcSet,
  getOptimizedImageProps,
  getVehicleCardImage,
  generateSizesAttribute,
  preloadImage
} = ImageOptimizer;

export default ImageOptimizer;