/**
 * Email Marketing & Newsletter Content Generator for AUTO ANI
 * Creates personalized email campaigns and automated newsletters
 */

import { VehicleData } from './contentGenerator';

export interface EmailCampaignContent {
  subject: string;
  previewText: string;
  htmlContent: string;
  textContent: string;
  personalizable: boolean;
  segmentCriteria?: string[];
}

export interface NewsletterContent {
  title: string;
  sections: NewsletterSection[];
  htmlContent: string;
  textContent: string;
}

export interface NewsletterSection {
  type: 'hero' | 'vehicle-showcase' | 'market-insights' | 'tips' | 'cta' | 'footer';
  title?: string;
  content: string;
  vehicleIds?: string[];
}

export interface EmailOptions {
  language: 'sq' | 'sr' | 'en' | 'ar';
  campaignType: 'new-arrival' | 'price-drop' | 'newsletter' | 'follow-up' | 'abandoned-inquiry' | 'customer-segment';
  personalization?: {
    firstName?: string;
    lastName?: string;
    preferences?: string[];
  };
}

/**
 * Email Marketing Generator
 */
export class EmailMarketingGenerator {
  /**
   * Generate new vehicle arrival email
   */
  async generateNewArrivalEmail(vehicle: VehicleData, options: EmailOptions): Promise<EmailCampaignContent> {
    const subjects = {
      sq: `🚗 Sapo mbërrit: ${vehicle.make} ${vehicle.model} ${vehicle.year}!`,
      en: `🚗 Just Arrived: ${vehicle.make} ${vehicle.model} ${vehicle.year}!`,
      sr: `🚗 Upravo stiglo: ${vehicle.make} ${vehicle.model} ${vehicle.year}!`,
      ar: `🚗 وصل للتو: ${vehicle.make} ${vehicle.model} ${vehicle.year}!`
    };

    const previewTexts = {
      sq: `Zbuloni këtë automjet të shkëlqyer me vetëm ${this.formatMileage(vehicle.mileage)} km`,
      en: `Discover this excellent vehicle with only ${this.formatMileage(vehicle.mileage)} km`,
      sr: `Otkrijte ovo izvrsno vozilo sa samo ${this.formatMileage(vehicle.mileage)} km`,
      ar: `اكتشف هذه المركبة الممتازة مع ${this.formatMileage(vehicle.mileage)} كم فقط`
    };

    const htmlContent = this.buildNewArrivalHTML(vehicle, options);
    const textContent = this.buildNewArrivalText(vehicle, options);

    return {
      subject: subjects[options.language],
      previewText: previewTexts[options.language],
      htmlContent,
      textContent,
      personalizable: true,
      segmentCriteria: [vehicle.bodyType, vehicle.make, `price_${Math.floor(vehicle.price / 10000) * 10000}`]
    };
  }

  /**
   * Build HTML content for new arrival email
   */
  private buildNewArrivalHTML(vehicle: VehicleData, options: EmailOptions): string {
    const lang = options.language;
    const firstName = options.personalization?.firstName || '';

    const greetings = {
      sq: firstName ? `Përshëndetje ${firstName},` : 'Përshëndetje,',
      en: firstName ? `Hello ${firstName},` : 'Hello,',
      sr: firstName ? `Zdravo ${firstName},` : 'Zdravo,',
      ar: firstName ? `مرحبا ${firstName}،` : 'مرحبا،'
    };

    const ctaButtons = {
      sq: 'Shiko Detajet',
      en: 'View Details',
      sr: 'Pogledaj Detalje',
      ar: 'عرض التفاصيل'
    };

    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${vehicle.make} ${vehicle.model}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .vehicle-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .vehicle-image { width: 100%; height: 300px; object-fit: cover; }
        .vehicle-details { padding: 20px; }
        .vehicle-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1e3a8a; }
        .specs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .spec-item { padding: 10px; background: #f3f4f6; border-radius: 4px; font-size: 14px; }
        .price { font-size: 28px; font-weight: bold; color: #059669; margin: 20px 0; }
        .features { list-style: none; padding: 0; margin: 15px 0; }
        .features li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .features li:before { content: "✓ "; color: #059669; font-weight: bold; }
        .cta-button { display: inline-block; background: #1e3a8a; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 AUTO ANI</h1>
        <p style="font-size: 18px; margin: 10px 0;">New Vehicle Arrival</p>
    </div>

    <div class="content">
        <p style="font-size: 16px;">${greetings[lang]}</p>
        <p>We're excited to announce a new addition to our inventory!</p>

        <div class="vehicle-card">
            <div class="vehicle-details">
                <div class="vehicle-title">${vehicle.make} ${vehicle.model} ${vehicle.year}</div>

                <div class="specs">
                    <div class="spec-item">
                        <strong>Engine:</strong><br>${vehicle.engineSize}
                    </div>
                    <div class="spec-item">
                        <strong>Mileage:</strong><br>${this.formatMileage(vehicle.mileage)} km
                    </div>
                    <div class="spec-item">
                        <strong>Fuel Type:</strong><br>${vehicle.fuelType}
                    </div>
                    <div class="spec-item">
                        <strong>Transmission:</strong><br>${vehicle.transmission}
                    </div>
                </div>

                <div class="price">€${this.formatPrice(vehicle.price)}</div>

                <h3>Key Features:</h3>
                <ul class="features">
                    ${vehicle.features.slice(0, 5).map(f => `<li>${f}</li>`).join('')}
                </ul>

                <center>
                    <a href="https://autosalonani.com/vehicles/${vehicle.id}" class="cta-button">
                        ${ctaButtons[lang]}
                    </a>
                </center>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>AUTO ANI</strong></p>
        <p>📍 Pristina, Kosovo</p>
        <p>📞 +383 49 204 242</p>
        <p>✉️ info@autosalonani.com</p>
        <p style="margin-top: 15px; font-size: 11px;">
            You're receiving this email because you subscribed to AUTO ANI updates.
            <br><a href="{{unsubscribe_url}}">Unsubscribe</a>
        </p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Build text version of new arrival email
   */
  private buildNewArrivalText(vehicle: VehicleData, options: EmailOptions): string {
    const lang = options.language;
    const firstName = options.personalization?.firstName || '';

    const greetings = {
      sq: firstName ? `Përshëndetje ${firstName},` : 'Përshëndetje,',
      en: firstName ? `Hello ${firstName},` : 'Hello,',
      sr: firstName ? `Zdravo ${firstName},` : 'Zdravo,',
      ar: firstName ? `مرحبا ${firstName}،` : 'مرحبا،'
    };

    return `
${greetings[lang]}

NEW VEHICLE ARRIVAL

${vehicle.make} ${vehicle.model} ${vehicle.year}

SPECIFICATIONS:
- Engine: ${vehicle.engineSize}
- Mileage: ${this.formatMileage(vehicle.mileage)} km
- Fuel Type: ${vehicle.fuelType}
- Transmission: ${vehicle.transmission}
- Body Type: ${vehicle.bodyType}
- Color: ${vehicle.color}

PRICE: €${this.formatPrice(vehicle.price)}

KEY FEATURES:
${vehicle.features.slice(0, 5).map(f => `- ${f}`).join('\n')}

View full details: https://autosalonani.com/vehicles/${vehicle.id}

Contact us:
Phone: +383 49 204 242
Email: info@autosalonani.com

---
AUTO ANI - Your trusted partner for quality vehicles
Unsubscribe: {{unsubscribe_url}}
    `.trim();
  }

  /**
   * Generate weekly newsletter
   */
  async generateWeeklyNewsletter(options: EmailOptions): Promise<NewsletterContent> {
    const year = new Date().getFullYear();
    const month = new Date().toLocaleString(options.language, { month: 'long' });
    const date = new Date().toLocaleDateString(options.language);

    const titles = {
      sq: `AUTO ANI Newsletter - ${date}`,
      en: `AUTO ANI Newsletter - ${date}`,
      sr: `AUTO ANI Newsletter - ${date}`,
      ar: `نشرة AUTO ANI - ${date}`
    };

    const sections: NewsletterSection[] = [
      {
        type: 'hero',
        title: titles[options.language],
        content: this.buildNewsletterHero(options)
      },
      {
        type: 'market-insights',
        title: this.getMarketInsightsTitle(options.language),
        content: this.buildMarketInsights(options, year, month)
      },
      {
        type: 'tips',
        title: this.getTipsTitle(options.language),
        content: this.buildCarBuyingTips(options)
      },
      {
        type: 'cta',
        content: this.buildNewsletterCTA(options)
      }
    ];

    const htmlContent = this.buildNewsletterHTML(sections, options);
    const textContent = this.buildNewsletterText(sections, options);

    return {
      title: titles[options.language],
      sections,
      htmlContent,
      textContent
    };
  }

  /**
   * Build newsletter hero section
   */
  private buildNewsletterHero(options: EmailOptions): string {
    const content = {
      sq: 'Mirë se vini në newsletter-in tuaj javor të AUTO ANI! Këtë javë, ne kemi përditësime interesante, këshilla për blerjen e automjeteve, dhe njoftim për automjete të reja.',
      en: 'Welcome to your weekly AUTO ANI newsletter! This week, we have exciting updates, car buying tips, and announcements of new vehicles.',
      sr: 'Dobrodošli u vaš nedeljni AUTO ANI newsletter! Ove nedelje imamo uzbudljive vesti, savete za kupovinu automobila i najave novih vozila.',
      ar: 'مرحبًا بك في نشرتك الأسبوعية من AUTO ANI! هذا الأسبوع، لدينا تحديثات مثيرة ونصائح لشراء السيارات وإعلانات عن المركبات الجديدة.'
    };

    return content[options.language];
  }

  /**
   * Build market insights content
   */
  private buildMarketInsights(options: EmailOptions, year: number, month: string): string {
    const insights = {
      sq: `<p><strong>Trendi i Tregut për ${month} ${year}</strong></p>
<p>Këtë muaj, po shohim rritje të fortë të kërkesës për SUV kompakte dhe automjete me konsum të ulët. Çmimet janë mbajtur të qëndrueshme, duke i bërë këto kohë ideale për blerje.</p>
<ul>
<li>SUV kompakte: +15% interes</li>
<li>Automjete hibride: rritje e vazhdueshme</li>
<li>Diesel: ende preferenca kryesore (70% e shitjeve)</li>
</ul>`,

      en: `<p><strong>Market Trends for ${month} ${year}</strong></p>
<p>This month, we're seeing strong growth in demand for compact SUVs and fuel-efficient vehicles. Prices have remained stable, making this an ideal time to buy.</p>
<ul>
<li>Compact SUVs: +15% interest</li>
<li>Hybrid vehicles: continued growth</li>
<li>Diesel: still the main preference (70% of sales)</li>
</ul>`,

      sr: `<p><strong>Tržišni Trendovi za ${month} ${year}</strong></p>
<p>Ovog meseca vidimo snažan rast potražnje za kompaktnim SUV vozilima i ekonomičnim automobilima. Cene su ostale stabilne, što čini ovo idealno vreme za kupovinu.</p>
<ul>
<li>Kompaktni SUV: +15% interesovanje</li>
<li>Hibridna vozila: kontinuiran rast</li>
<li>Dizel: i dalje glavna preferencija (70% prodaje)</li>
</ul>`,

      ar: `<p><strong>اتجاهات السوق لشهر ${month} ${year}</strong></p>
<p>هذا الشهر، نشهد نموًا قويًا في الطلب على سيارات الدفع الرباعي المدمجة والمركبات الموفرة للوقود. ظلت الأسعار مستقرة، مما يجعل هذا وقتًا مثاليًا للشراء.</p>
<ul>
<li>سيارات الدفع الرباعي المدمجة: +15% اهتمام</li>
<li>المركبات الهجينة: نمو مستمر</li>
<li>الديزل: لا يزال التفضيل الرئيسي (70٪ من المبيعات)</li>
</ul>`
    };

    return insights[options.language];
  }

  /**
   * Build car buying tips
   */
  private buildCarBuyingTips(options: EmailOptions): string {
    const tips = {
      sq: `<p><strong>Këshilla Profesionale për Blerjen e Automjetit</strong></p>
<ol>
<li><strong>Kontrolloni historikun e shërbimit</strong> - Kërkoni prova të mirëmbajtjes së rregullt</li>
<li><strong>Inspektoni me kujdes</strong> - Kontrolloni për dëmtime apo ndryshk</li>
<li><strong>Bëni provë drejtimi</strong> - Testoni në rrugë të ndryshme</li>
<li><strong>Verifikoni VIN</strong> - Sigurohuni që automjeti nuk ka histori të fshehur</li>
<li><strong>Negocioni me vetëbesim</strong> - Njihni vlerën e tregut</li>
</ol>`,

      en: `<p><strong>Professional Tips for Car Buying</strong></p>
<ol>
<li><strong>Check service history</strong> - Request proof of regular maintenance</li>
<li><strong>Inspect carefully</strong> - Look for damage or rust</li>
<li><strong>Test drive</strong> - Test on different roads</li>
<li><strong>Verify VIN</strong> - Ensure the vehicle has no hidden history</li>
<li><strong>Negotiate confidently</strong> - Know the market value</li>
</ol>`,

      sr: `<p><strong>Profesionalni Saveti za Kupovinu Automobila</strong></p>
<ol>
<li><strong>Proverite istoriju servisa</strong> - Tražite dokaz redovnog održavanja</li>
<li><strong>Pažljivo pregledajte</strong> - Potražite oštećenja ili rđu</li>
<li><strong>Probna vožnja</strong> - Testirajte na različitim putevima</li>
<li><strong>Verifikujte VIN</strong> - Uverite se da vozilo nema skrivenu istoriju</li>
<li><strong>Pregovarajte sa samopouzdanjem</strong> - Znajte tržišnu vrednost</li>
</ol>`,

      ar: `<p><strong>نصائح احترافية لشراء السيارات</strong></p>
<ol>
<li><strong>تحقق من سجل الخدمة</strong> - اطلب إثبات الصيانة المنتظمة</li>
<li><strong>افحص بعناية</strong> - ابحث عن الأضرار أو الصدأ</li>
<li><strong>تجربة القيادة</strong> - اختبر على طرق مختلفة</li>
<li><strong>تحقق من VIN</strong> - تأكد من عدم وجود تاريخ مخفي للمركبة</li>
<li><strong>تفاوض بثقة</strong> - اعرف القيمة السوقية</li>
</ol>`
    };

    return tips[options.language];
  }

  /**
   * Build newsletter CTA
   */
  private buildNewsletterCTA(options: EmailOptions): string {
    const ctas = {
      sq: '<p style="text-align: center; font-size: 18px;"><strong>Gati për të gjetur automjetin e përkryer?</strong></p><p style="text-align: center;">Vizitoni showroom-in tonë ose kontaktoni ekipin tonë sot!</p>',
      en: '<p style="text-align: center; font-size: 18px;"><strong>Ready to find your perfect vehicle?</strong></p><p style="text-align: center;">Visit our showroom or contact our team today!</p>',
      sr: '<p style="text-align: center; font-size: 18px;"><strong>Spremni da pronađete svoje savršeno vozilo?</strong></p><p style="text-align: center;">Posetite naš showroom ili kontaktirajte naš tim danas!</p>',
      ar: '<p style="text-align: center; font-size: 18px;"><strong>هل أنت مستعد للعثور على سيارتك المثالية؟</strong></p><p style="text-align: center;">قم بزيارة صالة العرض لدينا أو اتصل بفريقنا اليوم!</p>'
    };

    return ctas[options.language];
  }

  private buildNewsletterHTML(sections: NewsletterSection[], options: EmailOptions): string {
    // Simplified HTML builder - would be more comprehensive in production
    return sections.map(section => `<section>${section.content}</section>`).join('\n');
  }

  private buildNewsletterText(sections: NewsletterSection[], options: EmailOptions): string {
    return sections.map(section => section.content.replace(/<[^>]*>/g, '')).join('\n\n');
  }

  private getMarketInsightsTitle(language: string): string {
    const titles = {
      sq: 'Insights nga Tregu',
      en: 'Market Insights',
      sr: 'Tržišni Uvidi',
      ar: 'رؤى السوق'
    };
    return titles[language as keyof typeof titles] || titles.en;
  }

  private getTipsTitle(language: string): string {
    const titles = {
      sq: 'Këshilla për Blerje',
      en: 'Buying Tips',
      sr: 'Saveti za Kupovinu',
      ar: 'نصائح الشراء'
    };
    return titles[language as keyof typeof titles] || titles.en;
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('en-US');
  }

  private formatMileage(mileage: number): string {
    return mileage.toLocaleString('en-US');
  }
}

export const emailMarketingGenerator = new EmailMarketingGenerator();