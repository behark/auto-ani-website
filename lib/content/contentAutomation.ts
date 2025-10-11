/**
 * Content Automation Orchestrator for AUTO ANI
 * Central service that coordinates all content generation and distribution
 */

import { vehicleDescriptionGenerator, VehicleData, ContentGenerationOptions } from './contentGenerator';
import { seoOptimizer, SEOOptimizationOptions } from './seoOptimizer';
import { blogPostGenerator, BlogTopic } from './blogGenerator';
import { socialMediaGenerator, SocialMediaOptions } from './socialMediaGenerator';
import { emailMarketingGenerator, EmailOptions } from './emailMarketingGenerator';

export interface ContentAutomationJob {
  id: string;
  type: 'vehicle-content' | 'blog-post' | 'social-media' | 'email-campaign' | 'newsletter';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export interface VehicleContentGenerationRequest {
  vehicleId: string;
  vehicleData: VehicleData;
  languages: Array<'sq' | 'sr' | 'en' | 'ar'>;
  platforms: Array<'website' | 'facebook' | 'instagram' | 'twitter' | 'linkedin'>;
  options?: Partial<ContentGenerationOptions>;
}

export interface BatchContentGenerationRequest {
  vehicles: VehicleData[];
  contentTypes: Array<'description' | 'social' | 'email'>;
  languages: Array<'sq' | 'sr' | 'en' | 'ar'>;
  schedule?: {
    socialMedia?: Date;
    email?: Date;
  };
}

/**
 * Content Automation Service
 * Orchestrates all content generation and distribution
 */
export class ContentAutomationService {
  private jobs: Map<string, ContentAutomationJob> = new Map();

  /**
   * Generate complete content package for a vehicle
   * Includes: descriptions, SEO metadata, social posts, and email content
   */
  async generateVehicleContentPackage(request: VehicleContentGenerationRequest): Promise<{
    descriptions: Record<string, any>;
    seo: Record<string, any>;
    socialPosts: Record<string, any[]>;
    emailContent: Record<string, any>;
  }> {
    const { vehicleData, languages, platforms, options } = request;

    const results = {
      descriptions: {} as Record<string, any>,
      seo: {} as Record<string, any>,
      socialPosts: {} as Record<string, any[]>,
      emailContent: {} as Record<string, any>
    };

    // Generate content for each language
    for (const language of languages) {
      // 1. Generate vehicle description
      const description = await vehicleDescriptionGenerator.generateDescription(
        vehicleData,
        {
          language,
          ...options
        }
      );
      results.descriptions[language] = description;

      // 2. Generate SEO metadata
      const seo = await seoOptimizer.generateVehicleSEO(
        vehicleData,
        {
          language,
          contentType: 'vehicle'
        }
      );
      results.seo[language] = seo;

      // 3. Generate social media posts for requested platforms
      if (platforms.length > 0) {
        const socialOptions: SocialMediaOptions = {
          language,
          postType: 'vehicle-showcase',
          includePrice: true,
          includeCallToAction: true
        };

        const socialPosts = await socialMediaGenerator.generateAllPlatformPosts(
          vehicleData,
          socialOptions
        );

        results.socialPosts[language] = socialPosts.filter(post =>
          platforms.some(p => p.toLowerCase() === post.platform.toLowerCase())
        );
      }

      // 4. Generate email content
      const emailOptions: EmailOptions = {
        language,
        campaignType: 'new-arrival'
      };

      const emailContent = await emailMarketingGenerator.generateNewArrivalEmail(
        vehicleData,
        emailOptions
      );
      results.emailContent[language] = emailContent;
    }

    return results;
  }

  /**
   * Batch generate content for multiple vehicles
   */
  async batchGenerateVehicleContent(request: BatchContentGenerationRequest): Promise<ContentAutomationJob[]> {
    const jobs: ContentAutomationJob[] = [];

    for (const vehicle of request.vehicles) {
      const jobId = this.generateJobId();
      const job: ContentAutomationJob = {
        id: jobId,
        type: 'vehicle-content',
        status: 'pending',
        createdAt: new Date()
      };

      this.jobs.set(jobId, job);
      jobs.push(job);

      // Process job asynchronously
      this.processVehicleContentJob(jobId, vehicle, request).catch(error => {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
      });
    }

    return jobs;
  }

  /**
   * Generate automated blog posts based on topics and trends
   */
  async generateAutomatedBlogPost(topic: BlogTopic): Promise<any> {
    const jobId = this.generateJobId();
    const job: ContentAutomationJob = {
      id: jobId,
      type: 'blog-post',
      status: 'processing',
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    try {
      // Generate blog post
      const blogPost = await blogPostGenerator.generateBlogPost(topic);

      // Generate SEO metadata
      const seo = await seoOptimizer.generateBlogSEO(
        blogPost.title,
        blogPost.content,
        blogPost.category,
        {
          language: topic.language,
          contentType: 'blog',
          targetKeywords: topic.targetKeywords
        }
      );

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = {
        blogPost,
        seo
      };

      return job.result;
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Generate weekly newsletter for all languages
   */
  async generateWeeklyNewsletter(languages: Array<'sq' | 'sr' | 'en' | 'ar'>): Promise<Record<string, any>> {
    const newsletters: Record<string, any> = {};

    for (const language of languages) {
      const newsletter = await emailMarketingGenerator.generateWeeklyNewsletter({
        language,
        campaignType: 'newsletter'
      });
      newsletters[language] = newsletter;
    }

    return newsletters;
  }

  /**
   * Schedule social media posts
   */
  async scheduleSocialMediaCampaign(
    vehicles: VehicleData[],
    options: {
      languages: Array<'sq' | 'sr' | 'en' | 'ar'>;
      platforms: Array<'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN'>;
      startDate: Date;
      frequency: 'daily' | 'twice-daily' | 'hourly';
      timezone?: string;
    }
  ): Promise<{
    scheduledPosts: any[];
    schedule: Date[];
  }> {
    const scheduledPosts: any[] = [];
    const schedule: Date[] = [];

    // Calculate posting schedule
    const postingTimes = this.calculatePostingSchedule(
      options.startDate,
      vehicles.length,
      options.frequency
    );

    let vehicleIndex = 0;
    for (const scheduledTime of postingTimes) {
      if (vehicleIndex >= vehicles.length) break;

      const vehicle = vehicles[vehicleIndex];

      for (const language of options.languages) {
        const socialOptions: SocialMediaOptions = {
          language,
          postType: 'vehicle-showcase',
          includePrice: true,
          includeCallToAction: true
        };

        const posts = await socialMediaGenerator.generateAllPlatformPosts(
          vehicle,
          socialOptions
        );

        // Filter by requested platforms
        const filteredPosts = posts.filter(post =>
          options.platforms.includes(post.platform)
        );

        filteredPosts.forEach(post => {
          scheduledPosts.push({
            ...post,
            vehicleId: (vehicle as any).id,
            scheduledFor: scheduledTime,
            language
          });
          schedule.push(scheduledTime);
        });
      }

      vehicleIndex++;
    }

    return {
      scheduledPosts,
      schedule
    };
  }

  /**
   * Generate dynamic pricing content
   */
  generatePricingContent(vehicle: VehicleData, language: 'sq' | 'sr' | 'en' | 'ar'): {
    priceDisplay: string;
    financingOptions: string;
    comparison: string;
    savings: string;
  } {
    const templates = {
      sq: {
        priceDisplay: `€${this.formatPrice(vehicle.price)}`,
        financingOptions: `Financim i disponueshëm nga €${Math.round(vehicle.price / 48)}/muaj për 48 muaj`,
        comparison: `Çmim mesatar i tregut: €${Math.round(vehicle.price * 1.1)} - Ju kurseni €${Math.round(vehicle.price * 0.1)}!`,
        savings: `Ofertë speciale - Kurseni deri në €${Math.round(vehicle.price * 0.1)}`
      },
      en: {
        priceDisplay: `€${this.formatPrice(vehicle.price)}`,
        financingOptions: `Financing available from €${Math.round(vehicle.price / 48)}/month for 48 months`,
        comparison: `Average market price: €${Math.round(vehicle.price * 1.1)} - You save €${Math.round(vehicle.price * 0.1)}!`,
        savings: `Special offer - Save up to €${Math.round(vehicle.price * 0.1)}`
      },
      sr: {
        priceDisplay: `€${this.formatPrice(vehicle.price)}`,
        financingOptions: `Finansiranje dostupno od €${Math.round(vehicle.price / 48)}/mesec za 48 meseci`,
        comparison: `Prosečna tržišna cena: €${Math.round(vehicle.price * 1.1)} - Štedite €${Math.round(vehicle.price * 0.1)}!`,
        savings: `Specijalna ponuda - Uštedite do €${Math.round(vehicle.price * 0.1)}`
      },
      ar: {
        priceDisplay: `€${this.formatPrice(vehicle.price)}`,
        financingOptions: `التمويل متاح من €${Math.round(vehicle.price / 48)}/شهر لمدة 48 شهرًا`,
        comparison: `متوسط ​​سعر السوق: €${Math.round(vehicle.price * 1.1)} - توفر €${Math.round(vehicle.price * 0.1)}!`,
        savings: `عرض خاص - وفر حتى €${Math.round(vehicle.price * 0.1)}`
      }
    };

    return templates[language];
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ContentAutomationJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ContentAutomationJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId);
      }
    }
  }

  // Private helper methods

  private async processVehicleContentJob(
    jobId: string,
    vehicle: VehicleData,
    request: BatchContentGenerationRequest
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';

      const result = await this.generateVehicleContentPackage({
        vehicleId: (vehicle as any).id,
        vehicleData: vehicle,
        languages: request.languages,
        platforms: ['website', 'facebook', 'instagram'],
        options: {}
      });

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }
  }

  private calculatePostingSchedule(
    startDate: Date,
    vehicleCount: number,
    frequency: 'daily' | 'twice-daily' | 'hourly'
  ): Date[] {
    const schedule: Date[] = [];
    const baseDate = new Date(startDate);

    const intervals = {
      'daily': 24 * 60 * 60 * 1000,
      'twice-daily': 12 * 60 * 60 * 1000,
      'hourly': 60 * 60 * 1000
    };

    const interval = intervals[frequency];

    for (let i = 0; i < vehicleCount; i++) {
      const scheduledTime = new Date(baseDate.getTime() + (i * interval));
      schedule.push(scheduledTime);
    }

    return schedule;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('en-US');
  }
}

// Export singleton instance
export const contentAutomationService = new ContentAutomationService();

// Export all generators for direct access
export {
  vehicleDescriptionGenerator,
  seoOptimizer,
  blogPostGenerator,
  socialMediaGenerator,
  emailMarketingGenerator
};