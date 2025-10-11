/**
 * Social Media Content Generator for AUTO ANI
 * Creates platform-optimized content for Facebook, Instagram, Twitter, and LinkedIn
 */

import { VehicleData } from './contentGenerator';

export interface SocialMediaPost {
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN';
  content: string;
  hashtags: string[];
  mediaUrls?: string[];
  characterCount: number;
  scheduledFor?: Date;
}

export interface SocialMediaOptions {
  language: 'sq' | 'sr' | 'en' | 'ar';
  postType: 'vehicle-showcase' | 'promotional' | 'educational' | 'engagement' | 'testimonial';
  includePrice?: boolean;
  includeCallToAction?: boolean;
  tone?: 'professional' | 'friendly' | 'urgent' | 'luxury';
}

/**
 * Social Media Content Generator
 */
export class SocialMediaGenerator {
  private platformLimits = {
    FACEBOOK: 63206,
    INSTAGRAM: 2200,
    TWITTER: 280,
    LINKEDIN: 3000
  };

  private hashtagsByLanguage = {
    sq: {
      general: ['#AutoANI', '#AutoKosovo', '#BlerjeMakinash', '#AutoShitje', '#Kosovo'],
      vehicle: ['#Automjete', '#Makina', '#Auto', '#Cars'],
      luxury: ['#LuxuryCars', '#PremiumAuto', '#AutoLuksoze'],
      suv: ['#SUV', '#4x4', '#Crossover'],
      family: ['#FamilyCar', '#AutoFamilje']
    },
    en: {
      general: ['#AutoANI', '#KosovoCars', '#CarDeals', '#CarSales', '#Kosovo'],
      vehicle: ['#Cars', '#Vehicles', '#Auto', '#Automotive'],
      luxury: ['#LuxuryCars', '#PremiumAuto', '#LuxuryVehicles'],
      suv: ['#SUV', '#4x4', '#Crossover'],
      family: ['#FamilyCar', '#FamilyVehicle']
    },
    sr: {
      general: ['#AutoANI', '#AutoKosovo', '#KupovinaAuta', '#ProdajaAuta', '#Kosovo'],
      vehicle: ['#Automobili', '#Vozila', '#Auto', '#Cars'],
      luxury: ['#LuxuryAuto', '#PremiumAuto', '#LuksuznAuto'],
      suv: ['#SUV', '#4x4', '#Crossover'],
      family: ['#PorodičniAuto', '#FamilyCar']
    },
    ar: {
      general: ['#AutoANI', '#سيارات_كوسوفو', '#بيع_سيارات', '#كوسوفو'],
      vehicle: ['#سيارات', '#مركبات', '#سيارة'],
      luxury: ['#سيارات_فاخرة', '#سيارات_فخمة'],
      suv: ['#دفع_رباعي', '#SUV'],
      family: ['#سيارة_عائلية']
    }
  };

  /**
   * Generate social media posts for all platforms
   */
  async generateAllPlatformPosts(
    vehicle: VehicleData,
    options: SocialMediaOptions
  ): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    posts.push(await this.generateFacebookPost(vehicle, options));
    posts.push(await this.generateInstagramPost(vehicle, options));
    posts.push(await this.generateTwitterPost(vehicle, options));
    posts.push(await this.generateLinkedInPost(vehicle, options));

    return posts;
  }

  /**
   * Generate Facebook post
   */
  async generateFacebookPost(vehicle: VehicleData, options: SocialMediaOptions): Promise<SocialMediaPost> {
    const content = this.buildFacebookContent(vehicle, options);
    const hashtags = this.selectHashtags(options.language, vehicle, 5);

    return {
      platform: 'FACEBOOK',
      content,
      hashtags,
      mediaUrls: [],
      characterCount: content.length
    };
  }

  /**
   * Build Facebook content
   */
  private buildFacebookContent(vehicle: VehicleData, options: SocialMediaOptions): string {
    const templates = {
      sq: {
        showcase: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year} - Tani në dispozicion!

✨ Karakteristikat kryesore:
• Motor ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'sq')}
• Transmision ${this.translateTransmission(vehicle.transmission, 'sq')}
• Vetëm ${this.formatMileage(vehicle.mileage)} km
• ${vehicle.bodyType} - ${vehicle.color}

${options.includePrice ? `💰 Çmim special: €${this.formatPrice(vehicle.price)}` : ''}

${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

${options.includeCallToAction ? '📞 Kontaktoni sot për provë drejtimi dhe detaje të mëtejshme!\n📍 AUTO ANI - Partneri juaj i besuar për automjete cilësore' : ''}`,

        promotional: `🔥 OFERTË SPECIALE! 🔥

${vehicle.make} ${vehicle.model} ${vehicle.year}
${options.includePrice ? `Çmim: €${this.formatPrice(vehicle.price)}` : ''}

⏰ Oferta e kufizuar kohore!

Ky automjet është në gjendje të shkëlqyer dhe vjen me:
${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

Mos e humbisni këtë mundësi!
📞 Kontaktoni tani: +383 49 204 242`,

        educational: `💡 A e dini?

${vehicle.bodyType} si ${vehicle.make} ${vehicle.model} janë ideale për:
• Familje me fëmijë
• Udhëtime të gjata
• Rrugë të vështira
• Kushte dimërore

Motor ${vehicle.engineSize} ofron balancën perfekte ndërmjet performancës dhe ekonomisë!

🎯 Më shumë informacione: www.autosalonani.com`
      },
      en: {
        showcase: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year} - Now Available!

✨ Key Features:
• ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'en')} Engine
• ${this.translateTransmission(vehicle.transmission, 'en')} Transmission
• Only ${this.formatMileage(vehicle.mileage)} km
• ${vehicle.bodyType} - ${vehicle.color}

${options.includePrice ? `💰 Special Price: €${this.formatPrice(vehicle.price)}` : ''}

${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

${options.includeCallToAction ? '📞 Contact us today for test drive and more details!\n📍 AUTO ANI - Your trusted partner for quality vehicles' : ''}`,

        promotional: `🔥 SPECIAL OFFER! 🔥

${vehicle.make} ${vehicle.model} ${vehicle.year}
${options.includePrice ? `Price: €${this.formatPrice(vehicle.price)}` : ''}

⏰ Limited time offer!

This vehicle is in excellent condition and comes with:
${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

Don't miss this opportunity!
📞 Contact now: +383 49 204 242`,

        educational: `💡 Did you know?

${vehicle.bodyType} vehicles like ${vehicle.make} ${vehicle.model} are ideal for:
• Families with children
• Long trips
• Rough roads
• Winter conditions

${vehicle.engineSize} engine offers the perfect balance between performance and economy!

🎯 More info: www.autosalonani.com`
      },
      sr: {
        showcase: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year} - Sada dostupno!

✨ Ključne karakteristike:
• Motor ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'sr')}
• Menjač ${this.translateTransmission(vehicle.transmission, 'sr')}
• Samo ${this.formatMileage(vehicle.mileage)} km
• ${vehicle.bodyType} - ${vehicle.color}

${options.includePrice ? `💰 Specijalna cena: €${this.formatPrice(vehicle.price)}` : ''}

${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

${options.includeCallToAction ? '📞 Kontaktirajte nas danas za probnu vožnju i više detalja!\n📍 AUTO ANI - Vaš pouzdan partner za kvalitetna vozila' : ''}`
      },
      ar: {
        showcase: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year} - متاح الآن!

✨ المميزات الرئيسية:
• محرك ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'ar')}
• ناقل حركة ${this.translateTransmission(vehicle.transmission, 'ar')}
• فقط ${this.formatMileage(vehicle.mileage)} كم
• ${vehicle.bodyType} - ${vehicle.color}

${options.includePrice ? `💰 سعر خاص: €${this.formatPrice(vehicle.price)}` : ''}

${vehicle.features.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

${options.includeCallToAction ? '📞 اتصل بنا اليوم لتجربة القيادة والمزيد من التفاصيل!\n📍 AUTO ANI - شريكك الموثوق للمركبات عالية الجودة' : ''}`
      }
    };

    const langTemplates = templates[options.language] || templates.en;
    const template = langTemplates[options.postType as keyof typeof langTemplates] || langTemplates.showcase;

    return template;
  }

  /**
   * Generate Instagram post (optimized for visual platform)
   */
  async generateInstagramPost(vehicle: VehicleData, options: SocialMediaOptions): Promise<SocialMediaPost> {
    const templates = {
      sq: `✨ ${vehicle.make} ${vehicle.model} ${vehicle.year} ✨

${vehicle.engineSize} | ${vehicle.bodyType} | ${this.formatMileage(vehicle.mileage)}km

${options.includePrice ? `💰 €${this.formatPrice(vehicle.price)}` : ''}

Swipe për më shumë fotografi 📸

${options.includeCallToAction ? '👆 Link në bio për detaje\n📞 DM për informacion' : ''}`,

      en: `✨ ${vehicle.make} ${vehicle.model} ${vehicle.year} ✨

${vehicle.engineSize} | ${vehicle.bodyType} | ${this.formatMileage(vehicle.mileage)}km

${options.includePrice ? `💰 €${this.formatPrice(vehicle.price)}` : ''}

Swipe for more photos 📸

${options.includeCallToAction ? '👆 Link in bio for details\n📞 DM for info' : ''}`,

      sr: `✨ ${vehicle.make} ${vehicle.model} ${vehicle.year} ✨

${vehicle.engineSize} | ${vehicle.bodyType} | ${this.formatMileage(vehicle.mileage)}km

${options.includePrice ? `💰 €${this.formatPrice(vehicle.price)}` : ''}

Prevucite za više fotografija 📸

${options.includeCallToAction ? '👆 Link u bio za detalje\n📞 DM za informacije' : ''}`,

      ar: `✨ ${vehicle.make} ${vehicle.model} ${vehicle.year} ✨

${vehicle.engineSize} | ${vehicle.bodyType} | ${this.formatMileage(vehicle.mileage)} كم

${options.includePrice ? `💰 €${this.formatPrice(vehicle.price)}` : ''}

اسحب لمزيد من الصور 📸

${options.includeCallToAction ? '👆 الرابط في السيرة الذاتية للتفاصيل\n📞 DM للمعلومات' : ''}`
    };

    const content = templates[options.language as keyof typeof templates] || templates.en;
    const hashtags = this.selectHashtags(options.language, vehicle, 15);

    return {
      platform: 'INSTAGRAM',
      content,
      hashtags,
      mediaUrls: [],
      characterCount: content.length
    };
  }

  /**
   * Generate Twitter post (concise, under 280 characters)
   */
  async generateTwitterPost(vehicle: VehicleData, options: SocialMediaOptions): Promise<SocialMediaPost> {
    const templates = {
      sq: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year}
${vehicle.engineSize} | ${this.formatMileage(vehicle.mileage)}km
${options.includePrice ? `€${this.formatPrice(vehicle.price)}` : ''}
📞 +383 49 204 242`,

      en: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year}
${vehicle.engineSize} | ${this.formatMileage(vehicle.mileage)}km
${options.includePrice ? `€${this.formatPrice(vehicle.price)}` : ''}
📞 +383 49 204 242`,

      sr: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year}
${vehicle.engineSize} | ${this.formatMileage(vehicle.mileage)}km
${options.includePrice ? `€${this.formatPrice(vehicle.price)}` : ''}
📞 +383 49 204 242`,

      ar: `🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year}
${vehicle.engineSize} | ${this.formatMileage(vehicle.mileage)} كم
${options.includePrice ? `€${this.formatPrice(vehicle.price)}` : ''}
📞 +383 49 204 242`
    };

    const content = templates[options.language as keyof typeof templates] || templates.en;
    const hashtags = this.selectHashtags(options.language, vehicle, 3);

    return {
      platform: 'TWITTER',
      content,
      hashtags,
      mediaUrls: [],
      characterCount: content.length + hashtags.join(' ').length
    };
  }

  /**
   * Generate LinkedIn post (professional tone)
   */
  async generateLinkedInPost(vehicle: VehicleData, options: SocialMediaOptions): Promise<SocialMediaPost> {
    const templates = {
      sq: `Ne jemi të kënaqur të prezantojmë ${vehicle.make} ${vehicle.model} ${vehicle.year} në inventarin tonë.

Specifikat Teknike:
• Motor: ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'sq')}
• Transmision: ${this.translateTransmission(vehicle.transmission, 'sq')}
• Kilometrazha: ${this.formatMileage(vehicle.mileage)} km
• Tipi: ${vehicle.bodyType}

Ky automjet ka kaluar nëpër inspektime rigoroze dhe vjen me histori të plotë shërbimi.

${options.includePrice ? `Çmimi: €${this.formatPrice(vehicle.price)}` : ''}

AUTO ANI vazhdon të ofrojë cilësinë më të lartë dhe shërbimin profesional për klientët tanë.

#AutoANI #ProfessionalService #QualityVehicles`,

      en: `We are pleased to present the ${vehicle.make} ${vehicle.model} ${vehicle.year} in our inventory.

Technical Specifications:
• Engine: ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType, 'en')}
• Transmission: ${this.translateTransmission(vehicle.transmission, 'en')}
• Mileage: ${this.formatMileage(vehicle.mileage)} km
• Type: ${vehicle.bodyType}

This vehicle has undergone rigorous inspections and comes with full service history.

${options.includePrice ? `Price: €${this.formatPrice(vehicle.price)}` : ''}

AUTO ANI continues to provide the highest quality and professional service to our clients.

#AutoANI #ProfessionalService #QualityVehicles`
    };

    const content = templates[options.language as keyof typeof templates] || templates.en;
    const hashtags = this.selectHashtags(options.language, vehicle, 5);

    return {
      platform: 'LINKEDIN',
      content,
      hashtags,
      mediaUrls: [],
      characterCount: content.length
    };
  }

  /**
   * Select appropriate hashtags based on vehicle and language
   */
  private selectHashtags(language: string, vehicle: VehicleData, maxCount: number): string[] {
    const hashtags: string[] = [];
    const langHashtags = this.hashtagsByLanguage[language as keyof typeof this.hashtagsByLanguage] || this.hashtagsByLanguage.en;

    // Add general hashtags
    hashtags.push(...langHashtags.general);

    // Add vehicle-specific hashtags
    hashtags.push(...langHashtags.vehicle);

    // Add category-specific hashtags
    if (vehicle.price > 30000) {
      hashtags.push(...langHashtags.luxury);
    }

    if (vehicle.bodyType === 'SUV') {
      hashtags.push(...langHashtags.suv);
    }

    if (vehicle.seats && vehicle.seats >= 5) {
      hashtags.push(...langHashtags.family);
    }

    // Add brand hashtag
    hashtags.push(`#${vehicle.make.replace(/\s+/g, '')}`);

    // Remove duplicates and limit count
    return Array.from(new Set(hashtags)).slice(0, maxCount);
  }

  private translateFuelType(fuelType: string, language: string): string {
    const translations: Record<string, Record<string, string>> = {
      sq: { 'DIESEL': 'Diesel', 'PETROL': 'Benzinë', 'HYBRID': 'Hybrid', 'ELECTRIC': 'Elektrik' },
      en: { 'DIESEL': 'Diesel', 'PETROL': 'Petrol', 'HYBRID': 'Hybrid', 'ELECTRIC': 'Electric' },
      sr: { 'DIESEL': 'Dizel', 'PETROL': 'Benzin', 'HYBRID': 'Hibrid', 'ELECTRIC': 'Električni' },
      ar: { 'DIESEL': 'ديزل', 'PETROL': 'بنزين', 'HYBRID': 'هجين', 'ELECTRIC': 'كهربائي' }
    };
    return translations[language]?.[fuelType] || fuelType;
  }

  private translateTransmission(transmission: string, language: string): string {
    const translations: Record<string, Record<string, string>> = {
      sq: { 'AUTOMATIC': 'Automatik', 'MANUAL': 'Manual', 'DSG_AUTOMATIC': 'DSG Automatik' },
      en: { 'AUTOMATIC': 'Automatic', 'MANUAL': 'Manual', 'DSG_AUTOMATIC': 'DSG Automatic' },
      sr: { 'AUTOMATIC': 'Automatik', 'MANUAL': 'Manual', 'DSG_AUTOMATIC': 'DSG Automatik' },
      ar: { 'AUTOMATIC': 'أوتوماتيك', 'MANUAL': 'يدوي', 'DSG_AUTOMATIC': 'DSG أوتوماتيك' }
    };
    return translations[language]?.[transmission] || transmission;
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('en-US');
  }

  private formatMileage(mileage: number): string {
    return mileage.toLocaleString('en-US');
  }
}

export const socialMediaGenerator = new SocialMediaGenerator();