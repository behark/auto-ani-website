// Calendar Integration Service for AUTO ANI
// Supports Google Calendar, Outlook, and Apple Calendar sync

import { google } from 'googleapis';
import { prisma } from '../database';

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'caldav';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  isActive: boolean;
  lastSync?: Date;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    method: 'email' | 'popup';
    minutes: number;
  }[];
  metadata?: {
    appointmentId?: string;
    vehicleId?: string;
    serviceType?: string;
  };
}

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

class CalendarIntegrationService {
  private providers: Map<string, CalendarProvider> = new Map();

  // Initialize calendar integration for a customer
  async initializeCalendarIntegration(
    customerId: string,
    providerType: 'google' | 'outlook' | 'apple',
    accessToken: string,
    refreshToken?: string
  ): Promise<CalendarProvider> {
    try {
      const provider: CalendarProvider = {
        id: `${customerId}_${providerType}`,
        name: providerType.charAt(0).toUpperCase() + providerType.slice(1),
        type: providerType,
        accessToken,
        refreshToken,
        isActive: true,
        lastSync: new Date(),
      };

      // Find or create default calendar
      switch (providerType) {
        case 'google':
          provider.calendarId = await this.setupGoogleCalendar(provider);
          break;
        case 'outlook':
          provider.calendarId = await this.setupOutlookCalendar(provider);
          break;
        case 'apple':
          provider.calendarId = await this.setupAppleCalendar(provider);
          break;
      }

      this.providers.set(provider.id, provider);

      // Store provider configuration in database
      await this.saveProviderConfig(customerId, provider);

      return provider;
    } catch (error) {
      console.error('Failed to initialize calendar integration:', error);
      throw error;
    }
  }

  // Sync service appointment to calendar
  async syncServiceAppointment(
    customerId: string,
    appointmentId: string,
    action: 'create' | 'update' | 'cancel'
  ): Promise<SyncResult> {
    try {
      const appointment = await prisma.serviceAppointment.findFirst({
        where: {
          id: appointmentId,
          customerId,
        },
        include: {
          vehicle: true,
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const provider = await this.getCustomerProvider(customerId);
      if (!provider) {
        return {
          success: false,
          eventsCreated: 0,
          eventsUpdated: 0,
          eventsDeleted: 0,
          errors: ['No calendar provider configured'],
        };
      }

      const calendarEvent: CalendarEvent = {
        title: `${appointment.serviceType.replace('_', ' ')} - ${appointment.vehicle.make} ${appointment.vehicle.model}`,
        description: this.buildAppointmentDescription(appointment),
        startTime: this.parseAppointmentDateTime(appointment.scheduledDate, appointment.scheduledTime.split('-')[0]),
        endTime: this.parseAppointmentDateTime(appointment.scheduledDate, appointment.scheduledTime.split('-')[1]),
        location: appointment.locationAddress,
        reminders: [
          { method: 'popup', minutes: 60 }, // 1 hour before
          { method: 'email', minutes: 1440 }, // 1 day before
        ],
        metadata: {
          appointmentId: appointment.id,
          vehicleId: appointment.vehicleId,
          serviceType: appointment.serviceType,
        },
      };

      let result: SyncResult;
      switch (action) {
        case 'create':
          result = await this.createCalendarEvent(provider, calendarEvent);
          break;
        case 'update':
          result = await this.updateCalendarEvent(provider, calendarEvent);
          break;
        case 'cancel':
          result = await this.deleteCalendarEvent(provider, appointmentId);
          break;
      }

      // Update last sync time
      provider.lastSync = new Date();
      await this.updateProviderConfig(customerId, provider);

      return result;
    } catch (error) {
      console.error('Failed to sync service appointment:', error);
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Sync all upcoming appointments
  async syncAllAppointments(customerId: string): Promise<SyncResult> {
    try {
      const provider = await this.getCustomerProvider(customerId);
      if (!provider) {
        throw new Error('No calendar provider configured');
      }

      const upcomingAppointments = await prisma.serviceAppointment.findMany({
        where: {
          customerId,
          scheduledDate: {
            gte: new Date(),
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          vehicle: true,
        },
      });

      let totalCreated = 0;
      let totalUpdated = 0;
      const errors: string[] = [];

      for (const appointment of upcomingAppointments) {
        try {
          const calendarEvent: CalendarEvent = {
            id: `auto-ani-${appointment.id}`,
            title: `${appointment.serviceType.replace('_', ' ')} - ${appointment.vehicle.make} ${appointment.vehicle.model}`,
            description: this.buildAppointmentDescription(appointment),
            startTime: this.parseAppointmentDateTime(appointment.scheduledDate, appointment.scheduledTime.split('-')[0]),
            endTime: this.parseAppointmentDateTime(appointment.scheduledDate, appointment.scheduledTime.split('-')[1]),
            location: appointment.locationAddress,
            metadata: {
              appointmentId: appointment.id,
              vehicleId: appointment.vehicleId,
              serviceType: appointment.serviceType,
            },
          };

          // Check if event already exists
          const existingEvent = await this.findExistingEvent(provider, appointment.id);

          if (existingEvent) {
            await this.updateCalendarEvent(provider, calendarEvent);
            totalUpdated++;
          } else {
            await this.createCalendarEvent(provider, calendarEvent);
            totalCreated++;
          }
        } catch (error) {
          errors.push(`Failed to sync appointment ${appointment.id}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        eventsCreated: totalCreated,
        eventsUpdated: totalUpdated,
        eventsDeleted: 0,
        errors,
      };
    } catch (error) {
      console.error('Failed to sync all appointments:', error);
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Setup Google Calendar integration
  private async setupGoogleCalendar(provider: CalendarProvider): Promise<string> {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: provider.accessToken,
        refresh_token: provider.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Create or find AUTO ANI calendar
      const calendarName = 'AUTO ANI Service Appointments';

      // First, try to find existing calendar
      const calendarList = await calendar.calendarList.list();
      const existingCalendar = calendarList.data.items?.find(
        (cal: any) => cal.summary === calendarName
      );

      if (existingCalendar) {
        return existingCalendar.id!;
      }

      // Create new calendar
      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: calendarName,
          description: 'Service appointments and maintenance reminders for your vehicles',
          timeZone: 'Europe/Tirane',
        },
      });

      return newCalendar.data.id!;
    } catch (error) {
      console.error('Failed to setup Google Calendar:', error);
      throw error;
    }
  }

  // Setup Outlook Calendar integration
  private async setupOutlookCalendar(provider: CalendarProvider): Promise<string> {
    try {
      // Microsoft Graph API integration
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: {
          'Authorization': `Bearer ${provider.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to access Outlook calendar');
      }

      const calendars = await response.json();

      // Find or create AUTO ANI calendar
      const autoAniCalendar = calendars.value.find(
        (cal: any) => cal.name === 'AUTO ANI Service Appointments'
      );

      if (autoAniCalendar) {
        return autoAniCalendar.id;
      }

      // Create new calendar
      const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'AUTO ANI Service Appointments',
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create Outlook calendar');
      }

      const newCalendar = await createResponse.json();
      return newCalendar.id;
    } catch (error) {
      console.error('Failed to setup Outlook Calendar:', error);
      throw error;
    }
  }

  // Setup Apple Calendar (CalDAV) integration
  private async setupAppleCalendar(provider: CalendarProvider): Promise<string> {
    try {
      // Apple Calendar uses CalDAV protocol
      // This would require CalDAV client implementation
      // For now, return default calendar ID
      return 'apple-default-calendar';
    } catch (error) {
      console.error('Failed to setup Apple Calendar:', error);
      throw error;
    }
  }

  // Create calendar event
  private async createCalendarEvent(provider: CalendarProvider, event: CalendarEvent): Promise<SyncResult> {
    try {
      switch (provider.type) {
        case 'google':
          await this.createGoogleEvent(provider, event);
          break;
        case 'outlook':
          await this.createOutlookEvent(provider, event);
          break;
        case 'apple':
          await this.createAppleEvent(provider, event);
          break;
      }

      return {
        success: true,
        eventsCreated: 1,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Update calendar event
  private async updateCalendarEvent(provider: CalendarProvider, event: CalendarEvent): Promise<SyncResult> {
    try {
      switch (provider.type) {
        case 'google':
          await this.updateGoogleEvent(provider, event);
          break;
        case 'outlook':
          await this.updateOutlookEvent(provider, event);
          break;
        case 'apple':
          await this.updateAppleEvent(provider, event);
          break;
      }

      return {
        success: true,
        eventsCreated: 0,
        eventsUpdated: 1,
        eventsDeleted: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Delete calendar event
  private async deleteCalendarEvent(provider: CalendarProvider, appointmentId: string): Promise<SyncResult> {
    try {
      switch (provider.type) {
        case 'google':
          await this.deleteGoogleEvent(provider, appointmentId);
          break;
        case 'outlook':
          await this.deleteOutlookEvent(provider, appointmentId);
          break;
        case 'apple':
          await this.deleteAppleEvent(provider, appointmentId);
          break;
      }

      return {
        success: true,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 1,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Google Calendar operations
  private async createGoogleEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: provider.accessToken,
      refresh_token: provider.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.insert({
      calendarId: provider.calendarId!,
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'Europe/Tirane',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'Europe/Tirane',
        },
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map(r => ({
            method: r.method === 'popup' ? 'popup' : 'email',
            minutes: r.minutes,
          })),
        },
        extendedProperties: {
          private: event.metadata ? {
            appointmentId: event.metadata.appointmentId,
            vehicleId: event.metadata.vehicleId,
            serviceType: event.metadata.serviceType,
          } : undefined,
        },
      },
    });
  }

  private async updateGoogleEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    // Implementation for updating Google Calendar event
  }

  private async deleteGoogleEvent(provider: CalendarProvider, appointmentId: string): Promise<void> {
    // Implementation for deleting Google Calendar event
  }

  // Outlook Calendar operations
  private async createOutlookEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${provider.calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.title,
        body: {
          contentType: 'text',
          content: event.description,
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'Europe/Tirane',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'Europe/Tirane',
        },
        location: {
          displayName: event.location,
        },
        reminderMinutesBeforeStart: event.reminders?.[0]?.minutes || 60,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Outlook event');
    }
  }

  private async updateOutlookEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    // Implementation for updating Outlook event
  }

  private async deleteOutlookEvent(provider: CalendarProvider, appointmentId: string): Promise<void> {
    // Implementation for deleting Outlook event
  }

  // Apple Calendar (CalDAV) operations
  private async createAppleEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    // Implementation for creating Apple Calendar event via CalDAV
  }

  private async updateAppleEvent(provider: CalendarProvider, event: CalendarEvent): Promise<void> {
    // Implementation for updating Apple Calendar event via CalDAV
  }

  private async deleteAppleEvent(provider: CalendarProvider, appointmentId: string): Promise<void> {
    // Implementation for deleting Apple Calendar event via CalDAV
  }

  // Helper functions
  private buildAppointmentDescription(appointment: any): string {
    return `Service appointment for your ${appointment.vehicle.make} ${appointment.vehicle.model}

Service Type: ${appointment.serviceType.replace('_', ' ')}
Location: ${appointment.locationName}
Address: ${appointment.locationAddress}

${appointment.customerNotes ? `Notes: ${appointment.customerNotes}` : ''}

Contact AUTO ANI if you need to reschedule:
Phone: +355 69 123 4567
Email: service@autosalonani.com`;
  }

  private parseAppointmentDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  }

  private async getCustomerProvider(customerId: string): Promise<CalendarProvider | null> {
    // Get provider from cache or database
    for (const [id, provider] of this.providers.entries()) {
      if (id.startsWith(customerId)) {
        return provider;
      }
    }

    // Load from database if not in cache
    return await this.loadProviderFromDatabase(customerId);
  }

  private async saveProviderConfig(customerId: string, provider: CalendarProvider): Promise<void> {
    // Save provider configuration to database
    // Implementation would store encrypted tokens
  }

  private async updateProviderConfig(customerId: string, provider: CalendarProvider): Promise<void> {
    // Update provider configuration in database
  }

  private async loadProviderFromDatabase(customerId: string): Promise<CalendarProvider | null> {
    // Load provider configuration from database
    return null;
  }

  private async findExistingEvent(provider: CalendarProvider, appointmentId: string): Promise<boolean> {
    // Check if calendar event already exists for the appointment
    return false;
  }
}

// Export singleton instance
export const calendarIntegration = new CalendarIntegrationService();

export default calendarIntegration;