// Social Media service utilities for AUTO ANI Website
// Handles posting to Facebook, Instagram, Twitter, LinkedIn, TikTok
import { env, hasFacebook, hasInstagram } from './env';

interface SocialPlatformConfig {
  apiEndpoint?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  enabled: boolean;
}

interface SocialPostData {
  content: string;
  images?: string[];
  videos?: string[];
  hashtags?: string[];
  mentions?: string[];
  location?: string;
  callToAction?: string;
  scheduledAt?: Date;
}

interface SocialPostResult {
  success: boolean;
  postId?: string;
  platform: string;
  error?: string;
  scheduledId?: string;
}

// Platform configurations
const platformConfigs: Record<string, SocialPlatformConfig> = {
  facebook: {
    apiEndpoint: 'https://graph.facebook.com/v18.0',
    accessToken: env.FACEBOOK_ACCESS_TOKEN,
    clientId: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
    enabled: hasFacebook && !!(env.FACEBOOK_ACCESS_TOKEN && env.FACEBOOK_PAGE_ID)
  },
  instagram: {
    apiEndpoint: 'https://graph.facebook.com/v18.0',
    accessToken: env.INSTAGRAM_ACCESS_TOKEN || env.FACEBOOK_ACCESS_TOKEN,
    enabled: hasInstagram
  },
  twitter: {
    apiEndpoint: 'https://api.twitter.com/2',
    accessToken: env.TWITTER_BEARER_TOKEN,
    clientId: env.TWITTER_API_KEY,
    clientSecret: env.TWITTER_API_SECRET,
    enabled: !!(env.TWITTER_BEARER_TOKEN && env.TWITTER_API_KEY)
  },
  linkedin: {
    apiEndpoint: 'https://api.linkedin.com/v2',
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    clientId: process.env.LINKEDIN_CLIENT_ID,
    enabled: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_COMPANY_ID)
  },
  tiktok: {
    apiEndpoint: 'https://open-api.tiktok.com/share',
    accessToken: process.env.TIKTOK_ACCESS_TOKEN,
    enabled: !!process.env.TIKTOK_ACCESS_TOKEN
  },
  youtube: {
    apiEndpoint: 'https://www.googleapis.com/youtube/v3',
    accessToken: process.env.YOUTUBE_ACCESS_TOKEN,
    enabled: !!process.env.YOUTUBE_ACCESS_TOKEN
  }
};

// Social Media Service
export const SocialMediaService = {
  // Post to Facebook
  async postToFacebook(data: SocialPostData): Promise<SocialPostResult> {
    try {
      const config = platformConfigs.facebook;
      if (!config.enabled) {
        throw new Error('Facebook integration not configured');
      }

      const pageId = process.env.FACEBOOK_PAGE_ID;
      if (!pageId) {
        throw new Error('Facebook Page ID not configured');
      }

      // Prepare post content
      let message = data.content;
      if (data.callToAction) {
        message += `\n\n${data.callToAction}`;
      }

      const postData: Record<string, unknown> = {
        message,
        access_token: config.accessToken
      };

      // Add location if specified
      if (data.location) {
        // Facebook places API would require place ID lookup
        // For now, include in message
        postData.message += `\n\n📍 ${data.location}`;
      }

      // Handle media attachments
      if (data.images && data.images.length > 0) {
        if (data.images.length === 1) {
          // Single image post
          postData.url = data.images[0];
          const response = await fetch(`${config.apiEndpoint}/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error?.message || 'Facebook post failed');
          }

          return {
            success: true,
            postId: result.id,
            platform: 'facebook'
          };
        } else {
          // Multiple images - create album
          return await this.createFacebookAlbum(pageId, postData, data.images);
        }
      } else {
        // Text-only post
        const response = await fetch(`${config.apiEndpoint}/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || 'Facebook post failed');
        }

        return {
          success: true,
          postId: result.id,
          platform: 'facebook'
        };
      }

    } catch (error: unknown) {
      console.error('Facebook posting failed:', error);
      return {
        success: false,
        platform: 'facebook',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Post to Instagram
  async postToInstagram(data: SocialPostData): Promise<SocialPostResult> {
    try {
      const config = platformConfigs.instagram;
      if (!config.enabled) {
        throw new Error('Instagram integration not configured');
      }

      const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      if (!accountId) {
        throw new Error('Instagram Business Account ID not configured');
      }

      // Instagram requires at least one image or video
      if (!data.images?.length && !data.videos?.length) {
        throw new Error('Instagram posts require at least one image or video');
      }

      // Prepare caption with hashtags
      let caption = data.content;
      if (data.hashtags && data.hashtags.length > 0) {
        caption += `\n\n${data.hashtags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;
      }
      if (data.callToAction) {
        caption += `\n\n${data.callToAction}`;
      }

      const mediaUrl = data.images?.[0] || data.videos?.[0];
      const mediaType = data.videos?.length ? 'VIDEO' : 'IMAGE';

      // Step 1: Create media container
      const containerData = {
        image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
        video_url: mediaType === 'VIDEO' ? mediaUrl : undefined,
        media_type: mediaType,
        caption,
        access_token: config.accessToken
      };

      const containerResponse = await fetch(`${config.apiEndpoint}/${accountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerData)
      });

      const containerResult = await containerResponse.json();
      if (!containerResponse.ok) {
        throw new Error(containerResult.error?.message || 'Instagram container creation failed');
      }

      // Step 2: Publish the media
      const publishData = {
        creation_id: containerResult.id,
        access_token: config.accessToken
      };

      const publishResponse = await fetch(`${config.apiEndpoint}/${accountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData)
      });

      const publishResult = await publishResponse.json();
      if (!publishResponse.ok) {
        throw new Error(publishResult.error?.message || 'Instagram publish failed');
      }

      return {
        success: true,
        postId: publishResult.id,
        platform: 'instagram'
      };

    } catch (error: unknown) {
      console.error('Instagram posting failed:', error);
      return {
        success: false,
        platform: 'instagram',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Post to Twitter
  async postToTwitter(data: SocialPostData): Promise<SocialPostResult> {
    try {
      const config = platformConfigs.twitter;
      if (!config.enabled) {
        throw new Error('Twitter integration not configured');
      }

      // Prepare tweet content
      let text = data.content;
      if (data.hashtags && data.hashtags.length > 0) {
        const hashtagText = data.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        text += ` ${hashtagText}`;
      }

      // Ensure tweet is within character limit
      if (text.length > 280) {
        text = text.substring(0, 277) + '...';
      }

      const tweetData: { text: string; media?: { media_ids: string[] } } = { text };

      // Handle media attachments
      if (data.images && data.images.length > 0) {
        // Upload media first (simplified - actual implementation would upload to Twitter)
        // For now, include image URLs in text
        tweetData.text += `\n\n🖼️ View images: ${data.images[0]}`;
      }

      // Make API request using Twitter API v2
      const response = await fetch(`${config.apiEndpoint}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.errors?.[0]?.message || 'Twitter post failed');
      }

      return {
        success: true,
        postId: result.data.id,
        platform: 'twitter'
      };

    } catch (error: unknown) {
      console.error('Twitter posting failed:', error);
      return {
        success: false,
        platform: 'twitter',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Post to LinkedIn
  async postToLinkedIn(data: SocialPostData): Promise<SocialPostResult> {
    try {
      const config = platformConfigs.linkedin;
      if (!config.enabled) {
        throw new Error('LinkedIn integration not configured');
      }

      const companyId = process.env.LINKEDIN_COMPANY_ID;
      if (!companyId) {
        throw new Error('LinkedIn Company ID not configured');
      }

      // Prepare LinkedIn post
      const postData = {
        author: `urn:li:organization:${companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: data.content + (data.callToAction ? `\n\n${data.callToAction}` : '')
            },
            shareMediaCategory: data.images?.length ? 'IMAGE' : 'NONE',
            ...(data.images?.length && {
              media: data.images.slice(0, 1).map(imageUrl => ({
                status: 'READY',
                description: {
                  text: data.content
                },
                media: imageUrl,
                title: {
                  text: 'AUTO ANI - Quality Vehicles'
                }
              }))
            })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await fetch(`${config.apiEndpoint}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'LinkedIn post failed');
      }

      return {
        success: true,
        postId: result.id,
        platform: 'linkedin'
      };

    } catch (error: unknown) {
      console.error('LinkedIn posting failed:', error);
      return {
        success: false,
        platform: 'linkedin',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Create Facebook album for multiple images
  async createFacebookAlbum(pageId: string, baseData: Record<string, unknown>, images: string[]): Promise<SocialPostResult> {
    try {
      // Create album
      const albumData = {
        name: 'AUTO ANI Vehicles',
        message: baseData.message,
        access_token: baseData.access_token
      };

      const albumResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      });

      const albumResult = await albumResponse.json();
      if (!albumResponse.ok) {
        throw new Error(albumResult.error?.message || 'Album creation failed');
      }

      // Add photos to album
      const photoPromises = images.map(async (imageUrl, index) => {
        const photoData = {
          url: imageUrl,
          message: index === 0 ? baseData.message : '',
          access_token: baseData.access_token
        };

        return fetch(`https://graph.facebook.com/v18.0/${albumResult.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(photoData)
        });
      });

      await Promise.all(photoPromises);

      return {
        success: true,
        postId: albumResult.id,
        platform: 'facebook'
      };

    } catch (error: unknown) {
      throw error;
    }
  },

  // Publish post to multiple platforms
  async publishToMultiplePlatforms(platforms: string[], data: SocialPostData): Promise<SocialPostResult[]> {
    const results: SocialPostResult[] = [];

    const publishPromises = platforms.map(async (platform) => {
      try {
        switch (platform.toLowerCase()) {
          case 'facebook':
            return await this.postToFacebook(data);
          case 'instagram':
            return await this.postToInstagram(data);
          case 'twitter':
            return await this.postToTwitter(data);
          case 'linkedin':
            return await this.postToLinkedIn(data);
          default:
            return {
              success: false,
              platform,
              error: 'Platform not supported'
            };
        }
      } catch (error: unknown) {
        return {
          success: false,
          platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results_settled = await Promise.allSettled(publishPromises);

    results_settled.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          platform: 'unknown',
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return results;
  },

  // Get platform configuration status
  getPlatformStatus(): Record<string, { enabled: boolean; configured: boolean; missing?: string[] }> {
    const status: Record<string, { enabled: boolean; configured: boolean; error?: string }> = {};

    Object.entries(platformConfigs).forEach(([platform, config]) => {
      const missing: string[] = [];

      switch (platform) {
        case 'facebook':
          if (!process.env.FACEBOOK_ACCESS_TOKEN) missing.push('FACEBOOK_ACCESS_TOKEN');
          if (!process.env.FACEBOOK_PAGE_ID) missing.push('FACEBOOK_PAGE_ID');
          break;
        case 'instagram':
          if (!process.env.FACEBOOK_ACCESS_TOKEN) missing.push('FACEBOOK_ACCESS_TOKEN');
          if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) missing.push('INSTAGRAM_BUSINESS_ACCOUNT_ID');
          break;
        case 'twitter':
          if (!process.env.TWITTER_ACCESS_TOKEN) missing.push('TWITTER_ACCESS_TOKEN');
          if (!process.env.TWITTER_CLIENT_ID) missing.push('TWITTER_CLIENT_ID');
          break;
        case 'linkedin':
          if (!process.env.LINKEDIN_ACCESS_TOKEN) missing.push('LINKEDIN_ACCESS_TOKEN');
          if (!process.env.LINKEDIN_COMPANY_ID) missing.push('LINKEDIN_COMPANY_ID');
          break;
      }

      status[platform] = {
        enabled: config.enabled,
        configured: missing.length === 0,
        ...(missing.length > 0 && { missing })
      };
    });

    return status;
  },

  // Test platform connections
  async testPlatformConnections(): Promise<Record<string, { success: boolean; error?: string }>> {
    const results: Record<string, { success: boolean; postId?: string; error?: string }> = {};

    // Test Facebook
    if (platformConfigs.facebook.enabled) {
      try {
        const response = await fetch(`${platformConfigs.facebook.apiEndpoint}/me?access_token=${platformConfigs.facebook.accessToken}`);
        results.facebook = { success: response.ok };
        if (!response.ok) {
          const error = await response.json();
          results.facebook.error = error.error?.message || 'Connection failed';
        }
      } catch (error: unknown) {
        results.facebook = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } else {
      results.facebook = { success: false, error: 'Not configured' };
    }

    // Test Twitter
    if (platformConfigs.twitter.enabled) {
      try {
        const response = await fetch(`${platformConfigs.twitter.apiEndpoint}/users/me`, {
          headers: { 'Authorization': `Bearer ${platformConfigs.twitter.accessToken}` }
        });
        results.twitter = { success: response.ok };
        if (!response.ok) {
          const error = await response.json();
          results.twitter.error = error.errors?.[0]?.message || 'Connection failed';
        }
      } catch (error: unknown) {
        results.twitter = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } else {
      results.twitter = { success: false, error: 'Not configured' };
    }

    // Add other platform tests as needed

    return results;
  },

  // Validate configuration
  validateConfiguration() {
    try {
      const status = this.getPlatformStatus();
      const enabledPlatforms = Object.entries(status).filter(([, config]) => config.enabled);

      if (enabledPlatforms.length === 0) {
        throw new Error('No social media platforms configured');
      }

      return {
        success: true,
        platforms: status,
        enabledCount: enabledPlatforms.length
      };

    } catch (error: unknown) {
      console.error('Social media configuration validation failed:', error);
      throw error;
    }
  }
};

// Default export
export default SocialMediaService;