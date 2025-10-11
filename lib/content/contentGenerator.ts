/**
 * AI-Powered Content Generator for AUTO ANI
 * Generates vehicle descriptions, blog posts, and marketing content
 */

export interface VehicleData {
  id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  engineSize: string;
  drivetrain: string;
  features: string[];
  doors?: number;
  seats?: number;
}

export interface ContentGenerationOptions {
  language: 'sq' | 'sr' | 'en' | 'ar';
  tone?: 'professional' | 'friendly' | 'luxury' | 'sporty';
  length?: 'short' | 'medium' | 'long';
  includeFeatures?: boolean;
  includePricing?: boolean;
  targetAudience?: string[];
}

export interface GeneratedVehicleContent {
  title: string;
  description: string;
  highlights: string[];
  marketingCopy: string;
  specifications: string;
}

/**
 * Template-based vehicle description generator
 * Uses sophisticated templates with dynamic content generation
 */
export class VehicleDescriptionGenerator {
  private templates = {
    sq: {
      luxury: [
        'Zbuloni elegancën e {make} {model} {year}. Ky automjet i jashtëzakonshëm kombinon performancën superiore me luksin modern.',
        '{make} {model} {year} - një simbol i stilit dhe sofistikimit. Me vetëm {mileage} km, ky automjet ofron përvojë drejtimi të paharrueshme.',
        'Përjetoni klasën premium me {make} {model} {year}. Motor {engineSize} me transmision {transmission}, perfekt për ata që kërkojnë më të mirën.'
      ],
      sporty: [
        '{make} {model} {year} - fuqia takon stilin. Me motor {engineSize} dhe transmision {transmission}, ky automjet është gati për çdo aventurë.',
        'Performancë e shkëlqyer me {make} {model} {year}. {mileage} km të përkujdesura, gati të ju ofrojnë ndjesi adrenaline në çdo drejtim.',
        'Dinamizëm i pastër: {make} {model} {year} me {engineSize} motor. Perfekt për shoferin që do të ndiejë rrugën.'
      ],
      family: [
        '{make} {model} {year} - automjeti ideal për familjen tuaj. Hapësirë ​​e bollshme, sigurinë e garantuar dhe komoditet maksimal.',
        'Siguri dhe komoditet me {make} {model} {year}. {seats} vende, karakteristika moderne dhe {mileage} km mirëmbajtje të shkëlqyer.',
        'Perfekt për familjen: {make} {model} {year}. Kombinon hapësirën, sigurinë dhe ekonominë në një paketë të përsosur.'
      ],
      professional: [
        '{make} {model} {year} në gjendje të shkëlqyer. Motor {engineSize}, transmision {transmission}, vetëm {mileage} km. Inspektuar dhe certifikuar.',
        'Ofrojmë {make} {model} {year} me histori të plotë shërbimi. {engineSize} motor, {fuelType}, transmision {transmission}. Gjendje e përkryer.',
        '{make} {model} {year} - cilësi e garantuar. Me {mileage} km dhe mirëmbajtje të dokumentuar, ky automjet është zgjedhja ideale.'
      ]
    },
    en: {
      luxury: [
        'Discover the elegance of the {make} {model} {year}. This exceptional vehicle combines superior performance with modern luxury.',
        '{make} {model} {year} - a symbol of style and sophistication. With only {mileage} km, this vehicle offers an unforgettable driving experience.',
        'Experience premium class with {make} {model} {year}. {engineSize} engine with {transmission} transmission, perfect for those seeking the best.'
      ],
      sporty: [
        '{make} {model} {year} - power meets style. With {engineSize} engine and {transmission} transmission, this vehicle is ready for any adventure.',
        'Excellent performance with {make} {model} {year}. {mileage} km well-maintained, ready to give you adrenaline rushes on every drive.',
        'Pure dynamism: {make} {model} {year} with {engineSize} engine. Perfect for the driver who wants to feel the road.'
      ],
      family: [
        '{make} {model} {year} - the ideal vehicle for your family. Ample space, guaranteed safety, and maximum comfort.',
        'Safety and comfort with {make} {model} {year}. {seats} seats, modern features, and {mileage} km of excellent maintenance.',
        'Perfect for families: {make} {model} {year}. Combines space, safety, and economy in one perfect package.'
      ],
      professional: [
        '{make} {model} {year} in excellent condition. {engineSize} engine, {transmission} transmission, only {mileage} km. Inspected and certified.',
        'We offer {make} {model} {year} with full service history. {engineSize} engine, {fuelType}, {transmission} transmission. Perfect condition.',
        '{make} {model} {year} - guaranteed quality. With {mileage} km and documented maintenance, this vehicle is the ideal choice.'
      ]
    },
    sr: {
      luxury: [
        'Otkrijte eleganciju {make} {model} {year}. Ovo izuzetno vozilo kombinuje vrhunske performanse sa modernim luksusom.',
        '{make} {model} {year} - simbol stila i sofisticiranosti. Sa samo {mileage} km, ovo vozilo nudi nezaboravno iskustvo vožnje.',
        'Doživite premium klasu sa {make} {model} {year}. {engineSize} motor sa {transmission} menjačem, savršeno za one koji traže najbolje.'
      ],
      sporty: [
        '{make} {model} {year} - snaga susreće stil. Sa {engineSize} motorom i {transmission} menjačem, ovo vozilo je spremno za svaku avanturu.',
        'Izvrsne performanse sa {make} {model} {year}. {mileage} km dobro održavano, spremno da vam pruži adrenalin na svakoj vožnji.',
        'Čista dinamika: {make} {model} {year} sa {engineSize} motorom. Savršeno za vozača koji želi da oseti put.'
      ],
      family: [
        '{make} {model} {year} - idealno vozilo za vašu porodicu. Prostran, garantovana sigurnost i maksimalna udobnost.',
        'Sigurnost i udobnost sa {make} {model} {year}. {seats} sedišta, moderne karakteristike i {mileage} km odličnog održavanja.',
        'Savršeno za porodice: {make} {model} {year}. Kombinuje prostor, sigurnost i ekonomičnost u jednom savršenom paketu.'
      ],
      professional: [
        '{make} {model} {year} u odličnom stanju. {engineSize} motor, {transmission} menjač, samo {mileage} km. Pregledano i sertifikovano.',
        'Nudimo {make} {model} {year} sa potpunom istorijom servisa. {engineSize} motor, {fuelType}, {transmission} menjač. Perfektno stanje.',
        '{make} {model} {year} - garantovan kvalitet. Sa {mileage} km i dokumentovanim održavanjem, ovo vozilo je idealan izbor.'
      ]
    },
    ar: {
      luxury: [
        'اكتشف أناقة {make} {model} {year}. تجمع هذه السيارة الاستثنائية بين الأداء المتفوق والفخامة الحديثة.',
        '{make} {model} {year} - رمز للأناقة والرقي. مع {mileage} كم فقط، تقدم هذه السيارة تجربة قيادة لا تُنسى.',
        'استمتع بالفئة الممتازة مع {make} {model} {year}. محرك {engineSize} مع ناقل حركة {transmission}، مثالي لمن يبحثون عن الأفضل.'
      ],
      sporty: [
        '{make} {model} {year} - القوة تلتقي بالأناقة. مع محرك {engineSize} وناقل حركة {transmission}، هذه السيارة جاهزة لأي مغامرة.',
        'أداء ممتاز مع {make} {model} {year}. {mileage} كم محفوظة جيدًا، جاهزة لمنحك اندفاع الأدرينالين في كل قيادة.',
        'ديناميكية نقية: {make} {model} {year} بمحرك {engineSize}. مثالي للسائق الذي يريد أن يشعر بالطريق.'
      ],
      family: [
        '{make} {model} {year} - السيارة المثالية لعائلتك. مساحة واسعة، سلامة مضمونة، وراحة قصوى.',
        'السلامة والراحة مع {make} {model} {year}. {seats} مقاعد، ميزات حديثة، و{mileage} كم من الصيانة الممتازة.',
        'مثالي للعائلات: {make} {model} {year}. يجمع بين المساحة والسلامة والاقتصاد في حزمة واحدة مثالية.'
      ],
      professional: [
        '{make} {model} {year} في حالة ممتازة. محرك {engineSize}، ناقل حركة {transmission}، فقط {mileage} كم. تم فحصها وشهادتها.',
        'نقدم {make} {model} {year} مع تاريخ خدمة كامل. محرك {engineSize}، {fuelType}، ناقل حركة {transmission}. حالة مثالية.',
        '{make} {model} {year} - جودة مضمونة. مع {mileage} كم وصيانة موثقة، هذه السيارة هي الخيار المثالي.'
      ]
    }
  };

  /**
   * Generate comprehensive vehicle description
   */
  async generateDescription(
    vehicle: VehicleData,
    options: ContentGenerationOptions
  ): Promise<GeneratedVehicleContent> {
    const tone = options.tone || this.determineTone(vehicle);
    const template = this.selectTemplate(options.language, tone);

    const description = this.fillTemplate(template, vehicle);
    const title = this.generateTitle(vehicle, options.language);
    const highlights = this.generateHighlights(vehicle, options.language);
    const marketingCopy = this.generateMarketingCopy(vehicle, options);
    const specifications = this.generateSpecifications(vehicle, options.language);

    return {
      title,
      description,
      highlights,
      marketingCopy,
      specifications
    };
  }

  /**
   * Determine the best tone based on vehicle characteristics
   */
  private determineTone(vehicle: VehicleData): 'luxury' | 'sporty' | 'family' | 'professional' {
    const luxuryBrands = ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Porsche', 'Jaguar'];
    const sportyModels = ['GTD', 'GTI', 'Sport', 'RS', 'M ', 'AMG', 'S-Line'];
    const familyTypes = ['SUV', 'VAN', 'WAGON'];

    if (luxuryBrands.some(brand => vehicle.make.includes(brand))) {
      return 'luxury';
    }

    if (sportyModels.some(model => vehicle.model.includes(model))) {
      return 'sporty';
    }

    if (familyTypes.includes(vehicle.bodyType) && vehicle.seats && vehicle.seats >= 5) {
      return 'family';
    }

    return 'professional';
  }

  /**
   * Select appropriate template
   */
  private selectTemplate(language: string, tone: string): string {
    const templates = this.templates[language as keyof typeof this.templates]?.[tone as keyof typeof this.templates.en];
    if (!templates || templates.length === 0) {
      return this.templates.en.professional[0];
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Fill template with vehicle data
   */
  private fillTemplate(template: string, vehicle: VehicleData): string {
    let filled = template;
    const replacements: Record<string, string> = {
      '{make}': vehicle.make,
      '{model}': vehicle.model,
      '{year}': vehicle.year.toString(),
      '{price}': this.formatPrice(vehicle.price),
      '{mileage}': this.formatMileage(vehicle.mileage),
      '{fuelType}': this.translateFuelType(vehicle.fuelType),
      '{transmission}': this.translateTransmission(vehicle.transmission),
      '{bodyType}': vehicle.bodyType,
      '{color}': vehicle.color,
      '{engineSize}': vehicle.engineSize,
      '{drivetrain}': vehicle.drivetrain,
      '{seats}': vehicle.seats?.toString() || '5'
    };

    Object.entries(replacements).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(key, 'g'), value);
    });

    return filled;
  }

  /**
   * Generate engaging title
   */
  private generateTitle(vehicle: VehicleData, language: string): string {
    const templates = {
      sq: `${vehicle.make} ${vehicle.model} ${vehicle.year} - Cilësi Premium`,
      en: `${vehicle.make} ${vehicle.model} ${vehicle.year} - Premium Quality`,
      sr: `${vehicle.make} ${vehicle.model} ${vehicle.year} - Premium Kvalitet`,
      ar: `${vehicle.make} ${vehicle.model} ${vehicle.year} - جودة ممتازة`
    };
    return templates[language as keyof typeof templates] || templates.en;
  }

  /**
   * Generate key highlights
   */
  private generateHighlights(vehicle: VehicleData, language: string): string[] {
    const highlights = {
      sq: [
        `Motor ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType)}`,
        `Transmision ${this.translateTransmission(vehicle.transmission)}`,
        `Vetëm ${this.formatMileage(vehicle.mileage)} kilometra`,
        `${vehicle.bodyType} - ${vehicle.color}`,
        ...vehicle.features.slice(0, 3)
      ],
      en: [
        `${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType)} Engine`,
        `${this.translateTransmission(vehicle.transmission)} Transmission`,
        `Only ${this.formatMileage(vehicle.mileage)} kilometers`,
        `${vehicle.bodyType} - ${vehicle.color}`,
        ...vehicle.features.slice(0, 3)
      ],
      sr: [
        `Motor ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType)}`,
        `Menjač ${this.translateTransmission(vehicle.transmission)}`,
        `Samo ${this.formatMileage(vehicle.mileage)} kilometara`,
        `${vehicle.bodyType} - ${vehicle.color}`,
        ...vehicle.features.slice(0, 3)
      ],
      ar: [
        `محرك ${vehicle.engineSize} ${this.translateFuelType(vehicle.fuelType)}`,
        `ناقل حركة ${this.translateTransmission(vehicle.transmission)}`,
        `فقط ${this.formatMileage(vehicle.mileage)} كيلومتر`,
        `${vehicle.bodyType} - ${vehicle.color}`,
        ...vehicle.features.slice(0, 3)
      ]
    };

    return highlights[language as keyof typeof highlights] || highlights.en;
  }

  /**
   * Generate marketing copy
   */
  private generateMarketingCopy(vehicle: VehicleData, options: ContentGenerationOptions): string {
    const copies = {
      sq: `Mos humbisni shansin të zotëroni këtë ${vehicle.make} ${vehicle.model} të vitit ${vehicle.year}! ` +
          `Me vetëm ${this.formatMileage(vehicle.mileage)} km në tregues, ky automjet është në gjendje të shkëlqyer. ` +
          `Çmimi special: €${this.formatPrice(vehicle.price)}. Kontaktoni sot për një provë drejtimi!`,
      en: `Don't miss the chance to own this ${vehicle.year} ${vehicle.make} ${vehicle.model}! ` +
          `With only ${this.formatMileage(vehicle.mileage)} km on the odometer, this vehicle is in excellent condition. ` +
          `Special price: €${this.formatPrice(vehicle.price)}. Contact us today for a test drive!`,
      sr: `Ne propustite priliku da posedujete ovaj ${vehicle.make} ${vehicle.model} iz ${vehicle.year}! ` +
          `Sa samo ${this.formatMileage(vehicle.mileage)} km na brojilu, ovo vozilo je u odličnom stanju. ` +
          `Specijalna cena: €${this.formatPrice(vehicle.price)}. Kontaktirajte nas danas za probnu vožnju!`,
      ar: `لا تفوت فرصة امتلاك ${vehicle.make} ${vehicle.model} ${vehicle.year}! ` +
          `مع ${this.formatMileage(vehicle.mileage)} كم فقط على العداد، هذه السيارة في حالة ممتازة. ` +
          `سعر خاص: €${this.formatPrice(vehicle.price)}. اتصل بنا اليوم لتجربة القيادة!`
    };

    return copies[options.language] || copies.en;
  }

  /**
   * Generate detailed specifications
   */
  private generateSpecifications(vehicle: VehicleData, language: string): string {
    const labels = {
      sq: {
        make: 'Prodhuesi',
        model: 'Modeli',
        year: 'Viti',
        mileage: 'Kilometrazha',
        engine: 'Motori',
        fuel: 'Karburanti',
        transmission: 'Transmisioni',
        body: 'Karoseria',
        color: 'Ngjyra',
        drivetrain: 'Tërheqja',
        doors: 'Dyert',
        seats: 'Vendet'
      },
      en: {
        make: 'Make',
        model: 'Model',
        year: 'Year',
        mileage: 'Mileage',
        engine: 'Engine',
        fuel: 'Fuel Type',
        transmission: 'Transmission',
        body: 'Body Type',
        color: 'Color',
        drivetrain: 'Drivetrain',
        doors: 'Doors',
        seats: 'Seats'
      },
      sr: {
        make: 'Proizvođač',
        model: 'Model',
        year: 'Godina',
        mileage: 'Kilometraža',
        engine: 'Motor',
        fuel: 'Gorivo',
        transmission: 'Menjač',
        body: 'Karoserija',
        color: 'Boja',
        drivetrain: 'Pogon',
        doors: 'Vrata',
        seats: 'Sedišta'
      },
      ar: {
        make: 'الصانع',
        model: 'الموديل',
        year: 'السنة',
        mileage: 'المسافة المقطوعة',
        engine: 'المحرك',
        fuel: 'نوع الوقود',
        transmission: 'ناقل الحركة',
        body: 'نوع الهيكل',
        color: 'اللون',
        drivetrain: 'نظام الدفع',
        doors: 'الأبواب',
        seats: 'المقاعد'
      }
    };

    const l = labels[language as keyof typeof labels] || labels.en;

    return `
${l.make}: ${vehicle.make}
${l.model}: ${vehicle.model}
${l.year}: ${vehicle.year}
${l.mileage}: ${this.formatMileage(vehicle.mileage)} km
${l.engine}: ${vehicle.engineSize}
${l.fuel}: ${this.translateFuelType(vehicle.fuelType)}
${l.transmission}: ${this.translateTransmission(vehicle.transmission)}
${l.body}: ${vehicle.bodyType}
${l.color}: ${vehicle.color}
${l.drivetrain}: ${vehicle.drivetrain}
${vehicle.doors ? `${l.doors}: ${vehicle.doors}` : ''}
${vehicle.seats ? `${l.seats}: ${vehicle.seats}` : ''}
    `.trim();
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('en-US');
  }

  private formatMileage(mileage: number): string {
    return mileage.toLocaleString('en-US');
  }

  private translateFuelType(fuelType: string): string {
    const translations: Record<string, string> = {
      'DIESEL': 'Diesel',
      'PETROL': 'Benzinë / Gasoline',
      'HYBRID': 'Hybrid',
      'ELECTRIC': 'Elektrik / Electric',
      'LPG': 'LPG'
    };
    return translations[fuelType] || fuelType;
  }

  private translateTransmission(transmission: string): string {
    const translations: Record<string, string> = {
      'AUTOMATIC': 'Automatik / Automatic',
      'MANUAL': 'Manual / Manual',
      'DSG_AUTOMATIC': 'DSG Automatik / DSG Automatic',
      'CVT': 'CVT'
    };
    return translations[transmission] || transmission;
  }
}

export const vehicleDescriptionGenerator = new VehicleDescriptionGenerator();