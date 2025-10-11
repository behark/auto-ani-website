// Social Media Automation Integration for AUTO ANI
// Handles Facebook and Instagram automated posting for vehicles

import { prisma } from '@/lib/prisma';
import {
  ExternalAPIError,
  retryWithBackoff,
  Cache,
  getEnvVar,
} from '@/lib/api-utils';

// Cache for access tokens
const tokenCache = new Cache<string>();

export interface FacebookPostParams {
  message: string;
  imageUrls?: string[];
  link?: string;
  vehicleId?: string;
  scheduledTime?: Date;
}

export interface InstagramPostParams {
  caption: string;
  imageUrl: string;
  vehicleId?: string;
  scheduledTime?: Date;
}

export interface SocialMediaPost {
  platform: 'FACEBOOK' | 'INSTAGRAM';
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  vehicleId?: string;
  scheduledFor?: Date;
}

// Social Media Service Class
export class SocialMediaService {
  private static facebookAccessToken = getEnvVar('FACEBOOK_ACCESS_TOKEN', '');
  private static facebookPageId = getEnvVar('FACEBOOK_PAGE_ID', '');
  private static instagramAccountId = getEnvVar('INSTAGRAM_ACCOUNT_ID', '');
  private static apiVersion = 'v21.0';

  /**
   * Post to Facebook Page
   */
  static async postToFacebook(params: FacebookPostParams): Promise<string> {
    const { message, imageUrls = [], link, vehicleId, scheduledTime } = params;

    try {
      let postId: string;

      // If scheduled, store for later posting
      if (scheduledTime && scheduledTime > new Date()) {
        const dbPost = await prisma.socialMediaPost.create({
          data: {
            platform: 'FACEBOOK',
            content: message,
            mediaUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
            vehicleId,
            status: 'SCHEDULED',
            scheduledFor: scheduledTime,
            language: 'sq',
          },
        });

        return dbPost.id;
      }

      // Post immediately
      if (imageUrls.length > 0) {
        // Post with images
        postId = await this.postFacebookWithImages(message, imageUrls, link);
      } else {
        // Post text only
        postId = await this.postFacebookText(message, link);
      }

      // Store in database
      await prisma.socialMediaPost.create({
        data: {
          platform: 'FACEBOOK',
          content: message,
          mediaUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
          vehicleId,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalId: postId,
          language: 'sq',
        },
      });

      // Log API call
      await this.logAPICall({
        service: 'FACEBOOK',
        endpoint: 'feed',
        success: true,
        requestData: { message, imageUrls },
        responseData: { postId },
      });

      return postId;
    } catch (error: any) {
      console.error('Facebook Post Error:', error);

      // Store failed post
      await prisma.socialMediaPost.create({
        data: {
          platform: 'FACEBOOK',
          content: message,
          mediaUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
          vehicleId,
          status: 'FAILED',
          errorMessage: error.message,
          language: 'sq',
        },
      });

      // Log failed API call
      await this.logAPICall({
        service: 'FACEBOOK',
        endpoint: 'feed',
        success: false,
        requestData: { message, imageUrls },
        errorMessage: error.message,
      });

      throw new ExternalAPIError('Facebook', error.message);
    }
  }

  /**
   * Post text to Facebook
   */
  private static async postFacebookText(
    message: string,
    link?: string
  ): Promise<string> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.facebookPageId}/feed`;

    const body: any = {
      message,
      access_token: this.facebookAccessToken,
    };

    if (link) {
      body.link = link;
    }

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Facebook API error');
        }

        return res.json();
      },
      {
        shouldRetry: (error: any) => error.code === 'ECONNRESET',
      }
    );

    return response.id;
  }

  /**
   * Post with images to Facebook
   */
  private static async postFacebookWithImages(
    message: string,
    imageUrls: string[],
    link?: string
  ): Promise<string> {
    // For multiple images, we need to use the photos endpoint
    if (imageUrls.length === 1) {
      // Single image post
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.facebookPageId}/photos`;

      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: imageUrls[0],
              caption: message,
              access_token: this.facebookAccessToken,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message || 'Facebook API error');
          }

          return res.json();
        },
        {
          shouldRetry: (error: any) => error.code === 'ECONNRESET',
        }
      );

      return response.post_id;
    } else {
      // Multiple images - create album
      // First, upload images
      const photoIds = await Promise.all(
        imageUrls.map(async (url) => {
          const uploadUrl = `https://graph.facebook.com/${this.apiVersion}/${this.facebookPageId}/photos`;
          const res = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              published: false,
              access_token: this.facebookAccessToken,
            }),
          });

          const data = await res.json();
          return data.id;
        })
      );

      // Then create post with multiple photos
      const postUrl = `https://graph.facebook.com/${this.apiVersion}/${this.facebookPageId}/feed`;
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          attached_media: photoIds.map((id) => ({ media_fbid: id })),
          access_token: this.facebookAccessToken,
        }),
      });

      const data = await response.json();
      return data.id;
    }
  }

  /**
   * Post to Instagram
   */
  static async postToInstagram(params: InstagramPostParams): Promise<string> {
    const { caption, imageUrl, vehicleId, scheduledTime } = params;

    try {
      // If scheduled, store for later posting
      if (scheduledTime && scheduledTime > new Date()) {
        const dbPost = await prisma.socialMediaPost.create({
          data: {
            platform: 'INSTAGRAM',
            content: caption,
            mediaUrls: JSON.stringify([imageUrl]),
            vehicleId,
            status: 'SCHEDULED',
            scheduledFor: scheduledTime,
            language: 'sq',
          },
        });

        return dbPost.id;
      }

      // Step 1: Create media container
      const containerId = await this.createInstagramMediaContainer(
        imageUrl,
        caption
      );

      // Step 2: Publish media container
      const postId = await this.publishInstagramMediaContainer(containerId);

      // Store in database
      await prisma.socialMediaPost.create({
        data: {
          platform: 'INSTAGRAM',
          content: caption,
          mediaUrls: JSON.stringify([imageUrl]),
          vehicleId,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalId: postId,
          language: 'sq',
        },
      });

      // Log API call
      await this.logAPICall({
        service: 'INSTAGRAM',
        endpoint: 'media',
        success: true,
        requestData: { caption, imageUrl },
        responseData: { postId },
      });

      return postId;
    } catch (error: any) {
      console.error('Instagram Post Error:', error);

      // Store failed post
      await prisma.socialMediaPost.create({
        data: {
          platform: 'INSTAGRAM',
          content: caption,
          mediaUrls: JSON.stringify([imageUrl]),
          vehicleId,
          status: 'FAILED',
          errorMessage: error.message,
          language: 'sq',
        },
      });

      // Log failed API call
      await this.logAPICall({
        service: 'INSTAGRAM',
        endpoint: 'media',
        success: false,
        requestData: { caption, imageUrl },
        errorMessage: error.message,
      });

      throw new ExternalAPIError('Instagram', error.message);
    }
  }

  /**
   * Create Instagram media container
   */
  private static async createInstagramMediaContainer(
    imageUrl: string,
    caption: string
  ): Promise<string> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.instagramAccountId}/media`;

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imageUrl,
            caption,
            access_token: this.facebookAccessToken,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Instagram API error');
        }

        return res.json();
      },
      {
        shouldRetry: (error: any) => error.code === 'ECONNRESET',
      }
    );

    return response.id;
  }

  /**
   * Publish Instagram media container
   */
  private static async publishInstagramMediaContainer(
    containerId: string
  ): Promise<string> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.instagramAccountId}/media_publish`;

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: this.facebookAccessToken,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Instagram publish error');
        }

        return res.json();
      },
      {
        shouldRetry: (error: any) => error.code === 'ECONNRESET',
      }
    );

    return response.id;
  }

  /**
   * Post vehicle to both Facebook and Instagram
   */
  static async postVehicleToSocialMedia(
    vehicleId: string,
    customMessage?: string
  ): Promise<{ facebook?: string; instagram?: string; errors?: string[] }> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const images = JSON.parse(vehicle.images);
    const mainImage = images[0];

    // Generate post content
    const message =
      customMessage ||
      this.generateVehiclePostContent(vehicle);

    const hashtags = this.generateVehicleHashtags(vehicle);
    const instagramCaption = `${message}\n\n${hashtags.join(' ')}`;

    const results: {
      facebook?: string;
      instagram?: string;
      errors?: string[];
    } = {};

    // Post to Facebook
    try {
      results.facebook = await this.postToFacebook({
        message: `${message}\n\n${hashtags.join(' ')}`,
        imageUrls: images.slice(0, 10), // Facebook allows up to 10 images
        vehicleId,
      });
    } catch (error: any) {
      results.errors = results.errors || [];
      results.errors.push(`Facebook: ${error.message}`);
    }

    // Post to Instagram (single image only)
    if (mainImage) {
      try {
        results.instagram = await this.postToInstagram({
          caption: instagramCaption.slice(0, 2200), // Instagram caption limit
          imageUrl: mainImage,
          vehicleId,
        });
      } catch (error: any) {
        results.errors = results.errors || [];
        results.errors.push(`Instagram: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Generate vehicle post content
   */
  private static generateVehiclePostContent(vehicle: any): string {
    const features = JSON.parse(vehicle.features);
    const featuresText = features.slice(0, 3).join(', ');

    return `
🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year}

✨ Features: ${featuresText}
⚡ ${vehicle.fuelType} | ${vehicle.transmission}
📊 ${vehicle.mileage.toLocaleString()} km
💰 ${vehicle.price.toLocaleString()} EUR

📞 Contact us for more details!
📍 AUTO ANI - Your trusted car dealer
    `.trim();
  }

  /**
   * Generate hashtags for vehicle
   */
  private static generateVehicleHashtags(vehicle: any): string[] {
    const make = vehicle.make.toLowerCase().replace(/\s+/g, '');
    const model = vehicle.model.toLowerCase().replace(/\s+/g, '');

    return [
      `#${make}`,
      `#${model}`,
      `#${make}${model}`,
      '#autoani',
      '#cars',
      '#usedcars',
      '#carsales',
      '#kosovo',
      '#pristina',
      '#automjete',
      '#vetura',
      `#${vehicle.year}`,
      `#${vehicle.bodyType.toLowerCase()}`,
    ];
  }

  /**
   * Process scheduled posts
   */
  static async processScheduledPosts(): Promise<number> {
    const now = new Date();

    const scheduledPosts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now,
        },
      },
      take: 10,
    });

    let processedCount = 0;

    for (const post of scheduledPosts) {
      try {
        const mediaUrls = post.mediaUrls
          ? JSON.parse(post.mediaUrls)
          : [];

        if (post.platform === 'FACEBOOK') {
          await this.postToFacebook({
            message: post.content,
            imageUrls: mediaUrls,
            vehicleId: post.vehicleId || undefined,
          });
        } else if (post.platform === 'INSTAGRAM' && mediaUrls[0]) {
          await this.postToInstagram({
            caption: post.content,
            imageUrl: mediaUrls[0],
            vehicleId: post.vehicleId || undefined,
          });
        }

        processedCount++;
      } catch (error: any) {
        console.error(`Failed to process scheduled post ${post.id}:`, error);

        await prisma.socialMediaPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }
    }

    return processedCount;
  }

  /**
   * Get post performance metrics
   */
  static async getPostMetrics(postId: string): Promise<any> {
    // This would fetch metrics from Facebook/Instagram APIs
    // For now, return stored data
    return prisma.socialMediaPost.findUnique({
      where: { externalId: postId },
    });
  }

  /**
   * Log API call
   */
  private static async logAPICall(data: {
    service: string;
    endpoint: string;
    success: boolean;
    requestData?: any;
    responseData?: any;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await prisma.aPILog.create({
        data: {
          service: data.service,
          endpoint: data.endpoint,
          method: 'POST',
          requestData: data.requestData
            ? JSON.stringify(data.requestData)
            : undefined,
          responseData: data.responseData
            ? JSON.stringify(data.responseData)
            : undefined,
          success: data.success,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }
}

export default SocialMediaService;