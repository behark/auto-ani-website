/**
 * SEO Optimization Service for AUTO ANI
 * Generates SEO-friendly titles, descriptions, and keywords
 */

import { VehicleData } from './contentGenerator';

export interface SEOOptimizationOptions {
  language: 'sq' | 'sr' | 'en' | 'ar';
  contentType: 'vehicle' | 'blog' | 'landing-page' | 'category';
  targetKeywords?: string[];
  location?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  canonicalUrl?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  structuredData: Record<string, any>;
}

/**
 * Automotive SEO Keywords Database
 */
const automotiveKeywords = {
  sq: {
    brands: ['Mercedes', 'BMW', 'Audi', 'Volkswagen', 'Skoda', 'Peugeot', 'Renault'],
    bodyTypes: ['SUV', 'Sedan', 'Hatchback', 'Wagon', 'Coupe', 'Convertible'],
    features: ['automatik', 'diesel', 'benzinë', 'hybrid', 'elektrik', '4x4', 'AWD'],
    intent: [
      'shitje',
      'blerje',
      'çmim',
      'ofertë',
      'i ri',
      'i përdorur',
      'financim',
      'makinë',
      'automjet',
      'Kosovo',
      'Prishtinë'
    ],
    modifiers: ['cilësi premium', 'gjendje e shkëlqyer', 'çmim i mirë', 'ofertë speciale']
  },
  en: {
    brands: ['Mercedes', 'BMW', 'Audi', 'Volkswagen', 'Skoda', 'Peugeot', 'Renault'],
    bodyTypes: ['SUV', 'Sedan', 'Hatchback', 'Wagon', 'Coupe', 'Convertible'],
    features: ['automatic', 'diesel', 'petrol', 'hybrid', 'electric', '4x4', 'AWD'],
    intent: [
      'for sale',
      'buy',
      'price',
      'deal',
      'new',
      'used',
      'financing',
      'car',
      'vehicle',
      'Kosovo',
      'Pristina'
    ],
    modifiers: ['premium quality', 'excellent condition', 'great price', 'special offer']
  },
  sr: {
    brands: ['Mercedes', 'BMW', 'Audi', 'Volkswagen', 'Skoda', 'Peugeot', 'Renault'],
    bodyTypes: ['SUV', 'Sedan', 'Hatchback', 'Wagon', 'Coupe', 'Convertible'],
    features: ['automatik', 'dizel', 'benzin', 'hibrid', 'električni', '4x4', 'AWD'],
    intent: [
      'prodaja',
      'kupovina',
      'cena',
      'ponuda',
      'novo',
      'korišćeno',
      'finansiranje',
      'auto',
      'vozilo',
      'Kosovo',
      'Priština'
    ],
    modifiers: ['premium kvalitet', 'odlično stanje', 'dobra cena', 'specijalna ponuda']
  },
  ar: {
    brands: ['مرسيدس', 'بي إم دبليو', 'أودي', 'فولكس واجن', 'سكودا', 'بيجو', 'رينو'],
    bodyTypes: ['سيارة دفع رباعي', 'سيدان', 'هاتشباك', 'واجن', 'كوبيه', 'كابريوليه'],
    features: ['أوتوماتيك', 'ديزل', 'بنزين', 'هجين', 'كهربائي', '4x4', 'دفع رباعي'],
    intent: ['للبيع', 'شراء', 'سعر', 'عرض', 'جديد', 'مستعمل', 'تمويل', 'سيارة', 'مركبة', 'كوسوفو'],
    modifiers: ['جودة ممتازة', 'حالة ممتازة', 'سعر جيد', 'عرض خاص']
  }
};

/**
 * SEO Optimizer Class
 */
export class SEOOptimizer {
  /**
   * Generate complete SEO metadata for vehicle listings
   */
  async generateVehicleSEO(vehicle: VehicleData, options: SEOOptimizationOptions): Promise<SEOMetadata> {
    const keywords = this.generateKeywords(vehicle, options);
    const title = this.generateTitle(vehicle, options);
    const description = this.generateDescription(vehicle, options);
    const slug = this.generateSlug(vehicle, options);
    const structuredData = this.generateStructuredData(vehicle, options);

    return {
      title,
      description,
      keywords,
      slug,
      ogTitle: title,
      ogDescription: description,
      structuredData
    };
  }

  /**
   * Generate SEO-optimized title
   * Best practices: 50-60 characters, include primary keyword
   */
  private generateTitle(vehicle: VehicleData, options: SEOOptimizationOptions): string {
    const templates = {
      sq: `${vehicle.make} ${vehicle.model} ${vehicle.year} | Çmim: €${vehicle.price.toLocaleString()} | AUTO ANI`,
      en: `${vehicle.make} ${vehicle.model} ${vehicle.year} | Price: €${vehicle.price.toLocaleString()} | AUTO ANI`,
      sr: `${vehicle.make} ${vehicle.model} ${vehicle.year} | Cena: €${vehicle.price.toLocaleString()} | AUTO ANI`,
      ar: `${vehicle.make} ${vehicle.model} ${vehicle.year} | السعر: €${vehicle.price.toLocaleString()} | AUTO ANI`
    };

    let title = templates[options.language];

    // Ensure title is within optimal length
    if (title.length > 60) {
      title = `${vehicle.make} ${vehicle.model} ${vehicle.year} | AUTO ANI`;
    }

    return title;
  }

  /**
   * Generate SEO-optimized meta description
   * Best practices: 150-160 characters, include primary and secondary keywords
   */
  private generateDescription(vehicle: VehicleData, options: SEOOptimizationOptions): string {
    const templates = {
      sq: `${vehicle.make} ${vehicle.model} ${vehicle.year} me ${this.formatMileage(vehicle.mileage)} km. ` +
          `Motor ${vehicle.engineSize}, ${vehicle.transmission}. Cilësi e garantuar, çmim: €${vehicle.price.toLocaleString()}. ` +
          `Kontaktoni AUTO ANI për detaje dhe provë drejtimi.`,
      en: `${vehicle.make} ${vehicle.model} ${vehicle.year} with ${this.formatMileage(vehicle.mileage)} km. ` +
          `${vehicle.engineSize} engine, ${vehicle.transmission}. Guaranteed quality, price: €${vehicle.price.toLocaleString()}. ` +
          `Contact AUTO ANI for details and test drive.`,
      sr: `${vehicle.make} ${vehicle.model} ${vehicle.year} sa ${this.formatMileage(vehicle.mileage)} km. ` +
          `Motor ${vehicle.engineSize}, ${vehicle.transmission}. Garantovan kvalitet, cena: €${vehicle.price.toLocaleString()}. ` +
          `Kontaktirajte AUTO ANI za detalje i probnu vožnju.`,
      ar: `${vehicle.make} ${vehicle.model} ${vehicle.year} مع ${this.formatMileage(vehicle.mileage)} كم. ` +
          `محرك ${vehicle.engineSize}، ${vehicle.transmission}. جودة مضمونة، السعر: €${vehicle.price.toLocaleString()}. ` +
          `اتصل بـ AUTO ANI للحصول على التفاصيل وتجربة القيادة.`
    };

    let description = templates[options.language];

    // Ensure description is within optimal length
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    return description;
  }

  /**
   * Generate comprehensive keyword list
   */
  private generateKeywords(vehicle: VehicleData, options: SEOOptimizationOptions): string[] {
    const keywords: string[] = [];
    const lang = options.language;
    const kwDb = automotiveKeywords[lang];

    // Primary keywords
    keywords.push(`${vehicle.make} ${vehicle.model}`);
    keywords.push(`${vehicle.make} ${vehicle.model} ${vehicle.year}`);
    keywords.push(`${vehicle.make} ${vehicle.year}`);

    // Body type + brand combinations
    keywords.push(`${vehicle.bodyType} ${vehicle.make}`);
    keywords.push(`${vehicle.bodyType} ${vehicle.year}`);

    // Feature-based keywords
    keywords.push(`${vehicle.transmission} ${vehicle.make}`);
    keywords.push(`${vehicle.fuelType} ${vehicle.bodyType}`);

    // Intent-based keywords
    if (lang === 'sq') {
      keywords.push(`${vehicle.make} ${vehicle.model} shitje Kosovo`);
      keywords.push(`blerje ${vehicle.make} ${vehicle.model}`);
      keywords.push(`${vehicle.make} çmim Kosovo`);
      keywords.push(`auto ${vehicle.bodyType} Kosovo`);
    } else if (lang === 'en') {
      keywords.push(`${vehicle.make} ${vehicle.model} for sale Kosovo`);
      keywords.push(`buy ${vehicle.make} ${vehicle.model}`);
      keywords.push(`${vehicle.make} price Kosovo`);
      keywords.push(`${vehicle.bodyType} car Kosovo`);
    } else if (lang === 'sr') {
      keywords.push(`${vehicle.make} ${vehicle.model} prodaja Kosovo`);
      keywords.push(`kupovina ${vehicle.make} ${vehicle.model}`);
      keywords.push(`${vehicle.make} cena Kosovo`);
      keywords.push(`auto ${vehicle.bodyType} Kosovo`);
    }

    // Location-based keywords
    keywords.push('AUTO ANI');
    keywords.push('AUTO ANI Kosovo');

    // Add custom keywords if provided
    if (options.targetKeywords) {
      keywords.push(...options.targetKeywords);
    }

    // Remove duplicates and return
    return Array.from(new Set(keywords));
  }

  /**
   * Generate SEO-friendly URL slug
   */
  private generateSlug(vehicle: VehicleData, options: SEOOptimizationOptions): string {
    const parts = [
      vehicle.make.toLowerCase(),
      vehicle.model.toLowerCase().replace(/\s+/g, '-'),
      vehicle.year.toString(),
      vehicle.bodyType.toLowerCase()
    ];

    return parts
      .join('-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate structured data (Schema.org) for vehicle
   */
  private generateStructuredData(vehicle: VehicleData, options: SEOOptimizationOptions): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      brand: {
        '@type': 'Brand',
        name: vehicle.make
      },
      model: vehicle.model,
      vehicleModelDate: vehicle.year,
      bodyType: vehicle.bodyType,
      fuelType: this.mapFuelType(vehicle.fuelType),
      vehicleTransmission: this.mapTransmission(vehicle.transmission),
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: vehicle.mileage,
        unitCode: 'KMT'
      },
      color: vehicle.color,
      vehicleEngine: {
        '@type': 'EngineSpecification',
        engineDisplacement: {
          '@type': 'QuantitativeValue',
          value: vehicle.engineSize
        }
      },
      offers: {
        '@type': 'Offer',
        price: vehicle.price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'AutoDealer',
          name: 'AUTO ANI',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'XK',
            addressLocality: 'Pristina'
          }
        }
      }
    };
  }

  /**
   * Generate blog post SEO metadata
   */
  async generateBlogSEO(
    title: string,
    content: string,
    category: string,
    options: SEOOptimizationOptions
  ): Promise<SEOMetadata> {
    const keywords = this.extractKeywordsFromContent(content, options.language);
    const description = this.generateBlogDescription(content, options);
    const slug = this.generateBlogSlug(title);

    return {
      title: `${title} | AUTO ANI Blog`,
      description,
      keywords,
      slug,
      ogTitle: title,
      ogDescription: description,
      structuredData: this.generateBlogStructuredData(title, content, category)
    };
  }

  /**
   * Extract keywords from blog content using frequency analysis
   */
  private extractKeywordsFromContent(content: string, language: string): string[] {
    // Remove HTML tags and special characters
    const cleanContent = content.replace(/<[^>]*>/g, '').toLowerCase();

    // Split into words
    const words = cleanContent.split(/\s+/);

    // Common stop words to exclude (simplified)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'dhe', 'në', 'për', 'me', 'nga', 'ose', 'por', // Albanian
      'i', 'na', 'za', 'sa', 'iz', 'ili', 'ali' // Serbian
    ]);

    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Get top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  }

  /**
   * Generate blog description from content
   */
  private generateBlogDescription(content: string, options: SEOOptimizationOptions): string {
    // Remove HTML tags
    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Get first 150 characters
    let description = cleanContent.substring(0, 150);

    // Try to end at a sentence
    const lastPeriod = description.lastIndexOf('.');
    if (lastPeriod > 100) {
      description = description.substring(0, lastPeriod + 1);
    } else {
      description += '...';
    }

    return description;
  }

  /**
   * Generate blog slug
   */
  private generateBlogSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
  }

  /**
   * Generate blog structured data
   */
  private generateBlogStructuredData(title: string, content: string, category: string): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      articleBody: content.replace(/<[^>]*>/g, '').substring(0, 500),
      author: {
        '@type': 'Organization',
        name: 'AUTO ANI'
      },
      publisher: {
        '@type': 'Organization',
        name: 'AUTO ANI',
        logo: {
          '@type': 'ImageObject',
          url: 'https://autosalonani.com/logo.png'
        }
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };
  }

  /**
   * Calculate keyword density
   */
  calculateKeywordDensity(content: string, keyword: string): number {
    const cleanContent = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    const occurrences = (cleanContent.match(new RegExp(keywordLower, 'g')) || []).length;
    const totalWords = cleanContent.split(/\s+/).length;

    return (occurrences / totalWords) * 100;
  }

  /**
   * Generate canonical URL
   */
  generateCanonicalUrl(slug: string, contentType: string): string {
    const baseUrl = 'https://autosalonani.com';
    const paths = {
      vehicle: 'vehicles',
      blog: 'blog',
      'landing-page': 'pages',
      category: 'category'
    };

    return `${baseUrl}/${paths[contentType as keyof typeof paths]}/${slug}`;
  }

  private formatMileage(mileage: number): string {
    return mileage.toLocaleString('en-US');
  }

  private mapFuelType(fuelType: string): string {
    const mapping: Record<string, string> = {
      'DIESEL': 'Diesel',
      'PETROL': 'Gasoline',
      'HYBRID': 'Hybrid',
      'ELECTRIC': 'Electric',
      'LPG': 'LPG'
    };
    return mapping[fuelType] || fuelType;
  }

  private mapTransmission(transmission: string): string {
    const mapping: Record<string, string> = {
      'AUTOMATIC': 'Automatic',
      'MANUAL': 'Manual',
      'DSG_AUTOMATIC': 'Automatic',
      'CVT': 'Automatic'
    };
    return mapping[transmission] || transmission;
  }
}

export const seoOptimizer = new SEOOptimizer();