/**
 * Enhanced WhatsApp Business Integration for AUTO ANI
 * Features: Smart messaging, inquiry tracking, automated responses
 */

interface Vehicle {
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  status?: string;
  condition?: string;
  slug?: { current: string };
  financing?: {
    available?: boolean;
    monthlyPayment?: number;
    downPayment?: number;
  };
}

interface WhatsAppMessage {
  type: 'inquiry' | 'test_drive' | 'financing' | 'trade_in' | 'general';
  message: string;
  url: string;
}

interface BusinessConfig {
  phone: string;
  businessName: string;
  address: string;
  hours: string;
  language: 'sq' | 'sr' | 'en';
}

const BUSINESS_CONFIG: BusinessConfig = {
  phone: '38349204242',
  businessName: 'AUTO ANI',
  address: 'Gazmend Baliu, Mitrovicë, Kosovo',
  hours: 'E Hënë - E Premte: 8:00-18:00, E Shtunë: 9:00-16:00',
  language: 'sq'
};

// Multi-language message templates
const MESSAGE_TEMPLATES = {
  sq: {
    vehicleInquiry: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nJam i interesuar për këtë veturë:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Çmimi: €${vehicle.price?.toLocaleString()}\n\nA mund të më jepni më shumë informacione?\n\nFaleminderit!`,

    testDrive: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nDo të doja të rezervoj një test drive për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nKur është koha më e përshtatshme?\n\nFaleminderit!`,

    financing: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nJam i interesuar për financim për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nA mund të më informoni për opcionet e financimit dhe kushtet?\n\nFaleminderit!`,

    tradeIn: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nDo të doja të shkëmbej veturën time për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nA mund të vlerësoni veturën time dhe të më jepni një ofertë?\n\nFaleminderit!`,

    general: () =>
      `Përshëndetje! 👋\n\nDo të doja informacione për veturave që keni në dispozicion.\n\nFaleminderit!`,

    priceNegotiation: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nJam seriozisht i interesuar për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Çmimi i shpallur: €${vehicle.price?.toLocaleString()}\n\nA ka mundësi për negocim çmimi?\n\nFaleminderit!`,

    warranty: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nDo të doja informacione për garanci për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nÇfarë lloj garancie ofroni dhe sa kohë zgjat?\n\nFaleminderit!`,

    inspection: (vehicle: Vehicle) =>
      `Përshëndetje! 👋\n\nA mund të rezervoj një inspektim teknik për:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nDo të doja të kontrolloj gjendjen e veturës para blerjes.\n\nFaleminderit!`
  },

  sr: {
    vehicleInquiry: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nZainteresovan sam za ovo vozilo:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Cena: €${vehicle.price?.toLocaleString()}\n\nMožete li mi dati više informacija?\n\nHvala!`,

    testDrive: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nŽeleo bih da rezervišem test vožnju za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nKad je najbolje vreme?\n\nHvala!`,

    financing: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nZainteresovan sam za finansiranje za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nMožete li me informisati o opcijama finansiranja?\n\nHvala!`,

    tradeIn: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nŽeleo bih da zamenim moje vozilo za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nMožete li proceniti moje vozilo?\n\nHvala!`,

    general: () =>
      `Zdravo! 👋\n\nŽeleo bih informacije o dostupnim vozilima.\n\nHvala!`,

    priceNegotiation: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nOzbiljno sam zainteresovan za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Objavljena cena: €${vehicle.price?.toLocaleString()}\n\nDa li je moguća pregovori o ceni?\n\nHvala!`,

    warranty: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nŽeleo bih informacije o garanciji za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nKakvu garanciju nudite i koliko traje?\n\nHvala!`,

    inspection: (vehicle: Vehicle) =>
      `Zdravo! 👋\n\nMogu li da rezervišem tehnički pregled za:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nŽeleo bih da proverim stanje vozila pre kupovine.\n\nHvala!`
  },

  en: {
    vehicleInquiry: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'm interested in this vehicle:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Price: €${vehicle.price?.toLocaleString()}\n\nCould you provide more information?\n\nThank you!`,

    testDrive: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'd like to schedule a test drive for:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nWhen would be the best time?\n\nThank you!`,

    financing: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'm interested in financing for:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nCould you inform me about financing options?\n\nThank you!`,

    tradeIn: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'd like to trade in my vehicle for:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 €${vehicle.price?.toLocaleString()}\n\nCould you evaluate my current vehicle?\n\nThank you!`,

    general: () =>
      `Hello! 👋\n\nI'd like information about available vehicles.\n\nThank you!`,

    priceNegotiation: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'm seriously interested in:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Listed price: €${vehicle.price?.toLocaleString()}\n\nIs there room for price negotiation?\n\nThank you!`,

    warranty: (vehicle: Vehicle) =>
      `Hello! 👋\n\nI'd like warranty information for:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nWhat kind of warranty do you offer and how long does it last?\n\nThank you!`,

    inspection: (vehicle: Vehicle) =>
      `Hello! 👋\n\nCan I schedule a technical inspection for:\n\n🚗 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\nI'd like to check the vehicle condition before purchase.\n\nThank you!`
  }
};

export class WhatsAppIntegration {
  private config: BusinessConfig;
  private language: 'sq' | 'sr' | 'en';

  constructor(config?: Partial<BusinessConfig>) {
    this.config = { ...BUSINESS_CONFIG, ...config };
    this.language = this.config.language;
  }

  private encodeMessage(message: string): string {
    return encodeURIComponent(message);
  }

  private createWhatsAppUrl(message: string): string {
    return `https://wa.me/${this.config.phone}?text=${this.encodeMessage(message)}`;
  }

  // Core vehicle inquiry
  generateVehicleInquiry(vehicle: Vehicle): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].vehicleInquiry(vehicle);
    return {
      type: 'inquiry',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Test drive request
  generateTestDriveRequest(vehicle: Vehicle): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].testDrive(vehicle);
    return {
      type: 'test_drive',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Financing inquiry
  generateFinancingInquiry(vehicle: Vehicle): WhatsAppMessage {
    let message = MESSAGE_TEMPLATES[this.language].financing(vehicle);

    // Add financing details if available
    if (vehicle.financing?.monthlyPayment) {
      message += `\n\n💳 Pagesë mujore e vlerësuar: €${vehicle.financing.monthlyPayment}`;
    }

    return {
      type: 'financing',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Trade-in inquiry
  generateTradeInInquiry(vehicle: Vehicle): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].tradeIn(vehicle);
    return {
      type: 'trade_in',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Price negotiation
  generatePriceNegotiation(vehicle: Vehicle): WhatsAppMessage {
    let message = MESSAGE_TEMPLATES[this.language].priceNegotiation(vehicle);

    // Add discount info if original price exists
    if (vehicle.originalPrice && vehicle.originalPrice > vehicle.price) {
      const discount = vehicle.originalPrice - vehicle.price;
      message += `\n💸 Zbrit tashmë: €${discount.toLocaleString()}`;
    }

    return {
      type: 'inquiry',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Warranty inquiry
  generateWarrantyInquiry(vehicle: Vehicle): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].warranty(vehicle);
    return {
      type: 'inquiry',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Technical inspection
  generateInspectionRequest(vehicle: Vehicle): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].inspection(vehicle);
    return {
      type: 'inquiry',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // General inquiry
  generateGeneralInquiry(): WhatsAppMessage {
    const message = MESSAGE_TEMPLATES[this.language].general();
    return {
      type: 'general',
      message,
      url: this.createWhatsAppUrl(message)
    };
  }

  // Smart message based on vehicle status
  generateSmartMessage(vehicle: Vehicle): WhatsAppMessage {
    // If vehicle is sold, suggest similar vehicles
    if (vehicle.status === 'sold') {
      const message = this.language === 'sq'
        ? `Përshëndetje! 👋\n\nVetura ${vehicle.brand} ${vehicle.model} ${vehicle.year} është shitur.\n\nA keni vetura të ngjashme në dispozicion?\n\nFaleminderit!`
        : `Hello! 👋\n\nThe ${vehicle.brand} ${vehicle.model} ${vehicle.year} has been sold.\n\nDo you have similar vehicles available?\n\nThank you!`;

      return {
        type: 'inquiry',
        message,
        url: this.createWhatsAppUrl(message)
      };
    }

    // If vehicle is reserved, ask about waiting list
    if (vehicle.status === 'reserved') {
      const message = this.language === 'sq'
        ? `Përshëndetje! 👋\n\nVetura ${vehicle.brand} ${vehicle.model} ${vehicle.year} është rezervuar.\n\nA mund të më vendosni në listën e pritjes?\n\nFaleminderit!`
        : `Hello! 👋\n\nThe ${vehicle.brand} ${vehicle.model} ${vehicle.year} is reserved.\n\nCan you put me on the waiting list?\n\nThank you!`;

      return {
        type: 'inquiry',
        message,
        url: this.createWhatsAppUrl(message)
      };
    }

    // Default to regular inquiry
    return this.generateVehicleInquiry(vehicle);
  }

  // Get all quick actions for a vehicle
  getAllQuickActions(vehicle: Vehicle): {
    primary: WhatsAppMessage;
    secondary: WhatsAppMessage[];
  } {
    const primary = this.generateSmartMessage(vehicle);

    const secondary = [
      this.generateTestDriveRequest(vehicle),
      this.generateFinancingInquiry(vehicle),
      this.generateTradeInInquiry(vehicle),
      this.generatePriceNegotiation(vehicle),
      this.generateWarrantyInquiry(vehicle),
      this.generateInspectionRequest(vehicle)
    ];

    return { primary, secondary };
  }

  // Change language
  setLanguage(language: 'sq' | 'sr' | 'en'): void {
    this.language = language;
  }

  // Get business info for contact display
  getBusinessInfo(): BusinessConfig {
    return this.config;
  }
}

// Export default instance
export const whatsapp = new WhatsAppIntegration();

// Export utility functions
export function createVehicleWhatsAppUrl(vehicle: Vehicle, type: 'inquiry' | 'test_drive' | 'financing' | 'trade_in' = 'inquiry'): string {
  switch (type) {
    case 'test_drive':
      return whatsapp.generateTestDriveRequest(vehicle).url;
    case 'financing':
      return whatsapp.generateFinancingInquiry(vehicle).url;
    case 'trade_in':
      return whatsapp.generateTradeInInquiry(vehicle).url;
    default:
      return whatsapp.generateVehicleInquiry(vehicle).url;
  }
}

export function getQuickContactActions(vehicle: Vehicle) {
  return whatsapp.getAllQuickActions(vehicle);
}