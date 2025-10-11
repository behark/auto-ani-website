import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Google Analytics 4 Integration
export class GoogleAnalytics4Service {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor() {
    // Initialize the client with service account credentials
    this.client = new BetaAnalyticsDataClient({
      keyFilename: process.env.GOOGLE_ANALYTICS_KEY_FILE,
      // Or use JSON directly if stored as environment variable
      credentials: process.env.GOOGLE_ANALYTICS_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_ANALYTICS_CREDENTIALS)
        : undefined,
    });

    this.propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '';
  }

  // Get basic traffic metrics
  async getTrafficMetrics(startDate: string, endDate: string) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'pageviews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
        ],
        dimensions: [
          { name: 'date' },
        ],
      });

      return this.formatTrafficMetrics(response);
    } catch (error) {
      console.error('Error fetching traffic metrics:', error);
      throw error;
    }
  }

  // Get vehicle page performance
  async getVehiclePageMetrics(startDate: string, endDate: string) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'uniquePageviews' },
          { name: 'averageTimeOnPage' },
          { name: 'bounceRate' },
        ],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'CONTAINS',
              value: '/vehicles/',
            },
          },
        },
        orderBys: [
          {
            metric: {
              metricName: 'screenPageViews',
            },
            desc: true,
          },
        ],
        limit: 100,
      });

      return this.formatVehiclePageMetrics(response);
    } catch (error) {
      console.error('Error fetching vehicle page metrics:', error);
      throw error;
    }
  }

  // Get user acquisition data
  async getAcquisitionMetrics(startDate: string, endDate: string) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
        dimensions: [
          { name: 'sessionDefaultChannelGrouping' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        orderBys: [
          {
            metric: {
              metricName: 'totalUsers',
            },
            desc: true,
          },
        ],
      });

      return this.formatAcquisitionMetrics(response);
    } catch (error) {
      console.error('Error fetching acquisition metrics:', error);
      throw error;
    }
  }

  // Get conversion funnel data
  async getConversionFunnel(startDate: string, endDate: string) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'conversions' },
          { name: 'conversionRate' },
        ],
        dimensions: [
          { name: 'eventName' },
        ],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'vehicle_view',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'inquiry_submitted',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'test_drive_scheduled',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'purchase',
                  },
                },
              },
            ],
          },
        },
      });

      return this.formatConversionFunnel(response);
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      throw error;
    }
  }

  // Get search performance
  async getSearchMetrics(startDate: string, endDate: string) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalUsers' },
          { name: 'conversions' },
        ],
        dimensions: [
          { name: 'customEvent:search_term' },
          { name: 'customEvent:search_results_count' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'search',
            },
          },
        },
        orderBys: [
          {
            metric: {
              metricName: 'eventCount',
            },
            desc: true,
          },
        ],
        limit: 50,
      });

      return this.formatSearchMetrics(response);
    } catch (error) {
      console.error('Error fetching search metrics:', error);
      throw error;
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    try {
      const [response] = await this.client.runRealtimeReport({
        property: `properties/${this.propertyId}`,
        metrics: [
          { name: 'activeUsers' },
          { name: 'conversions' },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
      });

      return this.formatRealTimeMetrics(response);
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // Send custom events to GA4
  async trackEvent(eventName: string, parameters: Record<string, any>) {
    // This would typically be done client-side, but we can track server-side events
    // using the Measurement Protocol for GA4
    try {
      const measurementId = process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID;
      const apiSecret = process.env.GOOGLE_ANALYTICS_API_SECRET;

      if (!measurementId || !apiSecret) {
        throw new Error('Missing GA4 Measurement ID or API Secret');
      }

      const payload = {
        client_id: parameters.client_id || 'server-side-' + Date.now(),
        events: [
          {
            name: eventName,
            params: {
              ...parameters,
              server_side: true,
              timestamp_micros: Date.now() * 1000,
            },
          },
        ],
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`GA4 tracking failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  // Enhanced ecommerce tracking
  async trackPurchase(transactionData: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      brand: string;
      price: number;
      quantity: number;
    }>;
    customer_id?: string;
    customer_email?: string;
  }) {
    return this.trackEvent('purchase', transactionData);
  }

  // Track vehicle inquiries
  async trackVehicleInquiry(inquiryData: {
    vehicle_id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_price: number;
    inquiry_type: string;
    customer_email?: string;
  }) {
    return this.trackEvent('vehicle_inquiry', inquiryData);
  }

  // Track test drive bookings
  async trackTestDriveBooking(testDriveData: {
    vehicle_id: string;
    vehicle_make: string;
    vehicle_model: string;
    appointment_date: string;
    customer_email?: string;
  }) {
    return this.trackEvent('test_drive_booked', testDriveData);
  }

  // Format helper methods
  private formatTrafficMetrics(response: any) {
    const rows = response.rows || [];
    return rows.map((row: any) => ({
      date: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value || '0'),
      users: parseInt(row.metricValues[1].value || '0'),
      pageviews: parseInt(row.metricValues[2].value || '0'),
      bounceRate: parseFloat(row.metricValues[3].value || '0'),
      avgSessionDuration: parseFloat(row.metricValues[4].value || '0'),
      conversions: parseInt(row.metricValues[5].value || '0'),
    }));
  }

  private formatVehiclePageMetrics(response: any) {
    const rows = response.rows || [];
    return rows.map((row: any) => ({
      pagePath: row.dimensionValues[0].value,
      pageTitle: row.dimensionValues[1].value,
      pageViews: parseInt(row.metricValues[0].value || '0'),
      uniquePageViews: parseInt(row.metricValues[1].value || '0'),
      avgTimeOnPage: parseFloat(row.metricValues[2].value || '0'),
      bounceRate: parseFloat(row.metricValues[3].value || '0'),
      vehicleId: this.extractVehicleIdFromPath(row.dimensionValues[0].value),
    }));
  }

  private formatAcquisitionMetrics(response: any) {
    const rows = response.rows || [];
    return rows.map((row: any) => ({
      channelGroup: row.dimensionValues[0].value,
      source: row.dimensionValues[1].value,
      medium: row.dimensionValues[2].value,
      users: parseInt(row.metricValues[0].value || '0'),
      newUsers: parseInt(row.metricValues[1].value || '0'),
      sessions: parseInt(row.metricValues[2].value || '0'),
      conversions: parseInt(row.metricValues[3].value || '0'),
      revenue: parseFloat(row.metricValues[4].value || '0'),
    }));
  }

  private formatConversionFunnel(response: any) {
    const rows = response.rows || [];
    const funnelData: Record<string, any> = {};

    rows.forEach((row: any) => {
      const eventName = row.dimensionValues[0].value;
      funnelData[eventName] = {
        users: parseInt(row.metricValues[0].value || '0'),
        sessions: parseInt(row.metricValues[1].value || '0'),
        conversions: parseInt(row.metricValues[2].value || '0'),
        conversionRate: parseFloat(row.metricValues[3].value || '0'),
      };
    });

    return funnelData;
  }

  private formatSearchMetrics(response: any) {
    const rows = response.rows || [];
    return rows.map((row: any) => ({
      searchTerm: row.dimensionValues[0].value,
      resultsCount: parseInt(row.dimensionValues[1].value || '0'),
      searchCount: parseInt(row.metricValues[0].value || '0'),
      users: parseInt(row.metricValues[1].value || '0'),
      conversions: parseInt(row.metricValues[2].value || '0'),
    }));
  }

  private formatRealTimeMetrics(response: any) {
    const rows = response.rows || [];
    return {
      totalActiveUsers: rows.reduce((sum: number, row: any) =>
        sum + parseInt(row.metricValues[0].value || '0'), 0),
      totalConversions: rows.reduce((sum: number, row: any) =>
        sum + parseInt(row.metricValues[1].value || '0'), 0),
      byCountry: rows.map((row: any) => ({
        country: row.dimensionValues[0].value,
        device: row.dimensionValues[1].value,
        activeUsers: parseInt(row.metricValues[0].value || '0'),
        conversions: parseInt(row.metricValues[1].value || '0'),
      })),
    };
  }

  private extractVehicleIdFromPath(path: string): string | null {
    const match = path.match(/\/vehicles\/([^/?]+)/);
    return match ? match[1] : null;
  }
}

// Analytics aggregation service
export class AnalyticsAggregationService {
  private ga4Service: GoogleAnalytics4Service;

  constructor() {
    this.ga4Service = new GoogleAnalytics4Service();
  }

  // Combine GA4 data with internal analytics
  async getComprehensiveAnalytics(startDate: string, endDate: string) {
    try {
      const [
        trafficMetrics,
        vehicleMetrics,
        acquisitionMetrics,
        conversionFunnel,
        searchMetrics,
      ] = await Promise.all([
        this.ga4Service.getTrafficMetrics(startDate, endDate),
        this.ga4Service.getVehiclePageMetrics(startDate, endDate),
        this.ga4Service.getAcquisitionMetrics(startDate, endDate),
        this.ga4Service.getConversionFunnel(startDate, endDate),
        this.ga4Service.getSearchMetrics(startDate, endDate),
      ]);

      return {
        traffic: trafficMetrics,
        vehiclePages: vehicleMetrics,
        acquisition: acquisitionMetrics,
        funnel: conversionFunnel,
        search: searchMetrics,
        summary: this.calculateSummaryMetrics({
          trafficMetrics,
          vehicleMetrics,
          acquisitionMetrics,
          conversionFunnel,
        }),
      };
    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      throw error;
    }
  }

  // Calculate summary metrics
  private calculateSummaryMetrics(data: any) {
    const traffic = data.trafficMetrics;
    const acquisition = data.acquisitionMetrics;

    const totalSessions = traffic.reduce((sum: number, day: any) => sum + day.sessions, 0);
    const totalUsers = traffic.reduce((sum: number, day: any) => sum + day.users, 0);
    const totalPageviews = traffic.reduce((sum: number, day: any) => sum + day.pageviews, 0);
    const totalConversions = traffic.reduce((sum: number, day: any) => sum + day.conversions, 0);

    const avgBounceRate = traffic.length > 0
      ? traffic.reduce((sum: number, day: any) => sum + day.bounceRate, 0) / traffic.length
      : 0;

    const avgSessionDuration = traffic.length > 0
      ? traffic.reduce((sum: number, day: any) => sum + day.avgSessionDuration, 0) / traffic.length
      : 0;

    const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;

    // Top acquisition channels
    const topChannels = acquisition
      .sort((a: any, b: any) => b.users - a.users)
      .slice(0, 5)
      .map((channel: any) => ({
        name: channel.channelGroup,
        users: channel.users,
        sessions: channel.sessions,
        conversions: channel.conversions,
        conversionRate: channel.sessions > 0 ? (channel.conversions / channel.sessions) * 100 : 0,
      }));

    return {
      totalSessions,
      totalUsers,
      totalPageviews,
      totalConversions,
      conversionRate,
      avgBounceRate,
      avgSessionDuration,
      topChannels,
    };
  }

  // Sync GA4 data with internal analytics
  async syncWithInternalAnalytics(startDate: string, endDate: string) {
    try {
      const ga4Data = await this.getComprehensiveAnalytics(startDate, endDate);

      // Update internal analytics with GA4 data
      // This would involve calling your internal analytics APIs
      // to update SearchAnalytics, CustomerLifecycle, etc.

      // Example: Update search analytics with GA4 search data
      if (ga4Data.search.length > 0) {
        await this.updateInternalSearchAnalytics(ga4Data.search);
      }

      // Example: Update vehicle analytics with GA4 page data
      if (ga4Data.vehiclePages.length > 0) {
        await this.updateVehicleViewAnalytics(ga4Data.vehiclePages);
      }

      return {
        success: true,
        updatedRecords: ga4Data.search.length + ga4Data.vehiclePages.length,
        syncedData: ga4Data,
      };
    } catch (error) {
      console.error('Error syncing analytics:', error);
      throw error;
    }
  }

  private async updateInternalSearchAnalytics(searchData: any[]) {
    // Implementation would update SearchAnalytics model
    // with GA4 search data
    console.log('Updating search analytics with', searchData.length, 'records');
  }

  private async updateVehicleViewAnalytics(vehicleData: any[]) {
    // Implementation would update Vehicle model viewCount
    // with GA4 page view data
    console.log('Updating vehicle analytics with', vehicleData.length, 'records');
  }
}

// Export singleton instances
export const ga4Service = new GoogleAnalytics4Service();
export const analyticsAggregationService = new AnalyticsAggregationService();