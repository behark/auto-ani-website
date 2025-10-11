import { prisma } from '@/lib/database';
// Using any types since Prisma types are not available
import { generateSlug } from '@/lib/utils';

export interface PageBuilderConfig {
  name: string;
  title: string;
  description?: string;
  templateId?: string;
  campaignId?: string;
  customDomain?: string;
}

export interface ContentBlockData {
  blockId: string;
  position: number;
  rowIndex?: number;
  columnIndex?: number;
  data?: any;
  styles?: any;
  visibility?: any;
}

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio
  validation?: any;
}

export interface LandingPageFormConfig {
  name: string;
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  redirectUrl?: string;
  confirmationMessage?: string;
  leadScore?: number;
}

export interface VehicleShowcaseConfig {
  showcaseType: string;
  title?: string;
  description?: string;
  vehicleIds?: string[];
  filterCriteria?: any;
  maxVehicles?: number;
  sortOrder?: string;
  displayFields?: string[];
  layoutStyle?: string;
  showPricing?: boolean;
  showCTA?: boolean;
  ctaText?: string;
}

export interface ABTestConfig {
  name: string;
  description?: string;
  hypothesis?: string;
  trafficSplit?: number;
  conversionGoal: string;
  duration?: number;
  confidenceLevel?: number;
  minSampleSize?: number;
}

export class LandingPageBuilder {

  // Template Management
  static async getTemplates(category?: string) {
    const where = category ? { category, isPublic: true } : { isPublic: true };

    return await prisma.landingPageTemplate.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  static async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    layout: any;
    defaultContent: any;
    thumbnail?: string;
    customizableFields?: any;
    colorScheme?: any;
    typography?: any;
  }) {
    return await prisma.landingPageTemplate.create({
      data
    });
  }

  static async getContentBlocks(category?: string) {
    const where = category ? { category, isActive: true } : { isActive: true };

    return await prisma.contentBlock.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });
  }

  static async createContentBlock(data: {
    name: string;
    type: string;
    category: string;
    config: any;
    defaultData?: any;
    schema?: any;
    defaultStyles?: any;
    responsiveRules?: any;
    isInteractive?: boolean;
    requiresJS?: boolean;
    dependencies?: string[];
  }) {
    return await prisma.contentBlock.create({
      data
    });
  }

  // Page Creation
  static async createPage(config: PageBuilderConfig) {
    const slug = generateSlug(config.name);

    // Check if slug already exists
    const existingPage = await prisma.landingPage.findUnique({
      where: { slug }
    });

    if (existingPage) {
      throw new Error(`Page with slug "${slug}" already exists`);
    }

    const pageData: any = {
      name: config.name,
      slug,
      title: config.title,
      description: config.description,
      content: {}, // Will be populated with blocks
      campaignId: config.campaignId,
      templateId: config.templateId
    };

    // If using a template, copy its structure
    if (config.templateId) {
      const template = await prisma.landingPageTemplate.findUnique({
        where: { id: config.templateId }
      });

      if (template) {
        pageData.content = template.defaultContent;
        pageData.customCSS = template.colorScheme ? LandingPageBuilder.generateCSSFromColorScheme(template.colorScheme) : null;

        // Increment template usage
        await prisma.landingPageTemplate.update({
          where: { id: config.templateId },
          data: { usageCount: { increment: 1 } }
        });
      }
    }

    return await prisma.landingPage.create({
      data: pageData,
      include: {
        template: true,
        campaign: true
      }
    });
  }

  // Page Building
  static async addBlockToPage(pageId: string, blockData: ContentBlockData) {
    // Increment block usage count
    await prisma.contentBlock.update({
      where: { id: blockData.blockId },
      data: { usageCount: { increment: 1 } }
    });

    return await prisma.pageBlock.create({
      data: {
        landingPageId: pageId,
        contentBlockId: blockData.blockId,
        position: blockData.position,
        rowIndex: blockData.rowIndex || 0,
        columnIndex: blockData.columnIndex || 0,
        data: blockData.data,
        styles: blockData.styles,
        visibility: blockData.visibility
      },
      include: {
        contentBlock: true
      }
    });
  }

  static async updatePageBlock(blockId: string, updates: Partial<ContentBlockData>) {
    return await prisma.pageBlock.update({
      where: { id: blockId },
      data: {
        position: updates.position,
        rowIndex: updates.rowIndex,
        columnIndex: updates.columnIndex,
        data: updates.data,
        styles: updates.styles,
        visibility: updates.visibility
      }
    });
  }

  static async removeBlockFromPage(blockId: string) {
    return await prisma.pageBlock.delete({
      where: { id: blockId }
    });
  }

  static async reorderPageBlocks(pageId: string, blockOrders: { blockId: string; position: number }[]) {
    const updates = blockOrders.map(({ blockId, position }: { blockId: string; position: number }) =>
      prisma.pageBlock.update({
        where: { id: blockId },
        data: { position }
      })
    );

    return await prisma.$transaction(updates);
  }

  // Form Builder
  static async addFormToPage(pageId: string, formConfig: LandingPageFormConfig) {
    return await prisma.landingPageForm.create({
      data: {
        landingPageId: pageId,
        name: formConfig.name,
        title: formConfig.title,
        description: formConfig.description,
        fields: formConfig.fields,
        redirectUrl: formConfig.redirectUrl,
        confirmationMessage: formConfig.confirmationMessage,
        leadScore: formConfig.leadScore || 50
      }
    });
  }

  static async updatePageForm(formId: string, updates: Partial<LandingPageFormConfig>) {
    return await prisma.landingPageForm.update({
      where: { id: formId },
      data: updates
    });
  }

  // Vehicle Showcase
  static async addVehicleShowcase(pageId: string, showcaseConfig: VehicleShowcaseConfig) {
    return await prisma.vehicleShowcase.create({
      data: {
        landingPageId: pageId,
        showcaseType: showcaseConfig.showcaseType,
        title: showcaseConfig.title,
        description: showcaseConfig.description,
        vehicleIds: showcaseConfig.vehicleIds || [],
        filterCriteria: showcaseConfig.filterCriteria,
        maxVehicles: showcaseConfig.maxVehicles || 6,
        sortOrder: showcaseConfig.sortOrder || 'price_asc',
        displayFields: showcaseConfig.displayFields || ['image', 'title', 'price', 'year'],
        layoutStyle: showcaseConfig.layoutStyle || 'grid',
        showPricing: showcaseConfig.showPricing ?? true,
        showCTA: showcaseConfig.showCTA ?? true,
        ctaText: showcaseConfig.ctaText || 'View Details'
      }
    });
  }

  static async getVehiclesForShowcase(showcaseId: string) {
    const showcase = await prisma.vehicleShowcase.findUnique({
      where: { id: showcaseId }
    });

    if (!showcase) {
      throw new Error('Vehicle showcase not found');
    }

    const whereClause: any = { status: 'AVAILABLE' };

    // Apply filtering based on showcase type
    switch (showcase.showcaseType) {
      case 'FEATURED_VEHICLES':
        whereClause.featured = true;
        break;
      case 'RECENT_ARRIVALS':
        whereClause.createdAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        };
        break;
      case 'BRAND_SPECIFIC':
        if (showcase.filterCriteria?.brand) {
          whereClause.make = showcase.filterCriteria.brand;
        }
        break;
      case 'BODY_TYPE':
        if (showcase.filterCriteria?.bodyType) {
          whereClause.bodyType = showcase.filterCriteria.bodyType;
        }
        break;
      case 'FUEL_TYPE':
        if (showcase.filterCriteria?.fuelType) {
          whereClause.fuelType = showcase.filterCriteria.fuelType;
        }
        break;
      case 'PRICE_RANGE':
        if (showcase.filterCriteria?.minPrice || showcase.filterCriteria?.maxPrice) {
          whereClause.price = {};
          if (showcase.filterCriteria.minPrice) {
            whereClause.price.gte = showcase.filterCriteria.minPrice;
          }
          if (showcase.filterCriteria.maxPrice) {
            whereClause.price.lte = showcase.filterCriteria.maxPrice;
          }
        }
        break;
      case 'CUSTOM_SELECTION':
        if (showcase.vehicleIds.length > 0) {
          whereClause.id = { in: showcase.vehicleIds };
        }
        break;
    }

    // Apply additional filter criteria
    if (showcase.filterCriteria) {
      Object.entries(showcase.filterCriteria).forEach(([key, value]: [string, any]) => {
        if (key !== 'brand' && key !== 'bodyType' && key !== 'fuelType' && key !== 'minPrice' && key !== 'maxPrice') {
          whereClause[key] = value;
        }
      });
    }

    const orderBy = LandingPageBuilder.parseOrderBy(showcase.sortOrder);

    return await prisma.vehicle.findMany({
      where: whereClause,
      orderBy,
      take: showcase.maxVehicles,
      include: {
        images: true
      }
    });
  }

  // A/B Testing
  static async createABTest(pageId: string, testConfig: ABTestConfig) {
    return await prisma.aBTest.create({
      data: {
        landingPageId: pageId,
        name: testConfig.name,
        description: testConfig.description,
        hypothesis: testConfig.hypothesis,
        trafficSplit: testConfig.trafficSplit || 0.5,
        conversionGoal: testConfig.conversionGoal,
        duration: testConfig.duration,
        confidenceLevel: testConfig.confidenceLevel || 0.95,
        minSampleSize: testConfig.minSampleSize || 100,
        status: 'DRAFT'
      }
    });
  }

  static async startABTest(testId: string) {
    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });
  }

  static async stopABTest(testId: string, winnerVariant?: 'A' | 'B') {
    const updateData: any = {
      status: 'COMPLETED',
      endedAt: new Date()
    };

    if (winnerVariant) {
      updateData.winnerVariant = winnerVariant;
    }

    return await prisma.aBTest.update({
      where: { id: testId },
      data: updateData
    });
  }

  static async recordABTestVisitor(testId: string, variant: 'A' | 'B') {
    const field = variant === 'A' ? 'visitorsA' : 'visitorsB';

    return await prisma.aBTest.update({
      where: { id: testId },
      data: {
        [field]: { increment: 1 }
      }
    });
  }

  static async recordABTestConversion(testId: string, variant: 'A' | 'B') {
    const field = variant === 'A' ? 'conversionsA' : 'conversionsB';

    const test = await prisma.aBTest.update({
      where: { id: testId },
      data: {
        [field]: { increment: 1 }
      }
    });

    // Calculate conversion rates
    const conversionRateA = test.visitorsA > 0 ? test.conversionsA / test.visitorsA : 0;
    const conversionRateB = test.visitorsB > 0 ? test.conversionsB / test.visitorsB : 0;

    // Update conversion rates
    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        conversionRateA,
        conversionRateB,
        improvement: conversionRateA > 0 ? ((conversionRateB - conversionRateA) / conversionRateA) * 100 : 0
      }
    });

    return test;
  }

  // Page Management
  static async getPage(id: string) {
    return await prisma.landingPage.findUnique({
      where: { id },
      include: {
        template: true,
        campaign: true,
        pageBlocks: {
          include: {
            contentBlock: true
          },
          orderBy: { position: 'asc' }
        },
        forms: true,
        abTests: {
          where: { status: 'RUNNING' }
        },
        vehicleShowcases: true
      }
    });
  }

  static async getPageBySlug(slug: string) {
    return await prisma.landingPage.findUnique({
      where: { slug },
      include: {
        template: true,
        campaign: true,
        pageBlocks: {
          include: {
            contentBlock: true
          },
          orderBy: { position: 'asc' }
        },
        forms: true,
        abTests: {
          where: { status: 'RUNNING' }
        },
        vehicleShowcases: true
      }
    });
  }

  static async updatePage(id: string, updates: any) {
    return await prisma.landingPage.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  static async publishPage(id: string) {
    return await prisma.landingPage.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date()
      }
    });
  }

  static async unpublishPage(id: string) {
    return await prisma.landingPage.update({
      where: { id },
      data: {
        isPublished: false
      }
    });
  }

  static async deletePage(id: string) {
    // Delete all related data first
    await prisma.pageBlock.deleteMany({ where: { landingPageId: id } });
    await prisma.landingPageForm.deleteMany({ where: { landingPageId: id } });
    await prisma.aBTest.deleteMany({ where: { landingPageId: id } });
    await prisma.vehicleShowcase.deleteMany({ where: { landingPageId: id } });
    await prisma.pageAnalytics.deleteMany({ where: { landingPageId: id } });

    return await prisma.landingPage.delete({
      where: { id }
    });
  }

  static async incrementPageView(id: string) {
    return await prisma.landingPage.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    });
  }

  static async recordConversion(id: string) {
    return await prisma.landingPage.update({
      where: { id },
      data: {
        conversionCount: { increment: 1 }
      }
    });
  }

  // Utility Methods
  private static generateCSSFromColorScheme(colorScheme: any): string {
    let css = ':root {\n';

    Object.entries(colorScheme).forEach(([key, value]: [string, any]) => {
      css += `  --${key}: ${value};\n`;
    });

    css += '}';
    return css;
  }

  private static parseOrderBy(sortOrder: string): any {
    switch (sortOrder) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'year_desc':
        return { year: 'desc' };
      case 'year_asc':
        return { year: 'asc' };
      case 'mileage_asc':
        return { mileage: 'asc' };
      case 'mileage_desc':
        return { mileage: 'desc' };
      case 'newest':
        return { createdAt: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }
}