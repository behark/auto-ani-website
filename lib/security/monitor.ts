/**
 * Security Monitoring and Audit System
 *
 * Provides comprehensive security event tracking, threat detection,
 * and incident response capabilities
 */

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

/**
 * Security Event Types
 */
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_FAILED = 'MFA_FAILED',

  // Authorization Events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // Attack Detection
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  COMMAND_INJECTION_ATTEMPT = 'COMMAND_INJECTION_ATTEMPT',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BOT_DETECTED = 'BOT_DETECTED',
  VULNERABILITY_SCAN_DETECTED = 'VULNERABILITY_SCAN_DETECTED',

  // Data Events
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_DELETION = 'DATA_DELETION',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',

  // System Events
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  SECURITY_POLICY_UPDATED = 'SECURITY_POLICY_UPDATED',
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  CERTIFICATE_RENEWED = 'CERTIFICATE_RENEWED',
  SERVICE_DISRUPTION = 'SERVICE_DISRUPTION',
  SECURITY_PATCH_APPLIED = 'SECURITY_PATCH_APPLIED',

  // Compliance Events
  GDPR_REQUEST = 'GDPR_REQUEST',
  DATA_BREACH = 'DATA_BREACH',
  AUDIT_LOG_ACCESS = 'AUDIT_LOG_ACCESS',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
}

/**
 * Security Event Severity Levels
 */
export enum SecuritySeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Security Event Interface
 */
export interface SecurityEvent {
  id?: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  message: string;
  details?: Record<string, any>;
  metadata?: {
    country?: string;
    city?: string;
    isp?: string;
    isVpn?: boolean;
    isTor?: boolean;
    isProxy?: boolean;
  };
}

/**
 * Threat Detection Rules
 */
interface ThreatRule {
  name: string;
  description: string;
  condition: (event: SecurityEvent) => boolean;
  action: (event: SecurityEvent) => Promise<void>;
  severity: SecuritySeverity;
}

/**
 * Security Monitor Class
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private threatRules: ThreatRule[] = [];
  private alertThresholds = {
    failedLogins: 5,
    rateLimits: 10,
    suspiciousActivities: 3,
  };

  private constructor() {
    this.initializeThreatRules();
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Initialize threat detection rules
   */
  private initializeThreatRules() {
    // Brute force detection
    this.threatRules.push({
      name: 'Brute Force Detection',
      description: 'Detects multiple failed login attempts',
      condition: (event) => event.type === SecurityEventType.LOGIN_FAILED,
      action: async (event) => {
        const key = `failed_logins:${event.ipAddress}`;
        const count = await this.incrementRedisKey(key, 60 * 15); // 15 minute window

        if (count >= this.alertThresholds.failedLogins) {
          await this.blockIP(event.ipAddress, 'Brute force attack detected', 60 * 60); // 1 hour block
          await this.sendAlert({
            title: 'Brute Force Attack Detected',
            severity: SecuritySeverity.HIGH,
            details: {
              ip: event.ipAddress,
              attempts: count,
              userEmail: event.userEmail,
            },
          });
        }
      },
      severity: SecuritySeverity.HIGH,
    });

    // SQL Injection detection
    this.threatRules.push({
      name: 'SQL Injection Detection',
      description: 'Detects SQL injection attempts',
      condition: (event) => event.type === SecurityEventType.SQL_INJECTION_ATTEMPT,
      action: async (event) => {
        await this.blockIP(event.ipAddress, 'SQL injection attempt', 24 * 60 * 60); // 24 hour block
        await this.sendAlert({
          title: 'SQL Injection Attempt',
          severity: SecuritySeverity.CRITICAL,
          details: {
            ip: event.ipAddress,
            path: event.path,
            details: event.details,
          },
        });
      },
      severity: SecuritySeverity.CRITICAL,
    });

    // Rate limit abuse
    this.threatRules.push({
      name: 'Rate Limit Abuse',
      description: 'Detects excessive rate limit violations',
      condition: (event) => event.type === SecurityEventType.RATE_LIMIT_EXCEEDED,
      action: async (event) => {
        const key = `rate_limits:${event.ipAddress}`;
        const count = await this.incrementRedisKey(key, 60 * 60); // 1 hour window

        if (count >= this.alertThresholds.rateLimits) {
          await this.blockIP(event.ipAddress, 'Rate limit abuse', 6 * 60 * 60); // 6 hour block
          await this.sendAlert({
            title: 'Rate Limit Abuse Detected',
            severity: SecuritySeverity.MEDIUM,
            details: {
              ip: event.ipAddress,
              violations: count,
            },
          });
        }
      },
      severity: SecuritySeverity.MEDIUM,
    });

    // Vulnerability scanning detection
    this.threatRules.push({
      name: 'Vulnerability Scanner Detection',
      description: 'Detects automated vulnerability scanning',
      condition: (event) => event.type === SecurityEventType.VULNERABILITY_SCAN_DETECTED,
      action: async (event) => {
        await this.blockIP(event.ipAddress, 'Vulnerability scanning', 7 * 24 * 60 * 60); // 7 day block
        await this.sendAlert({
          title: 'Vulnerability Scanner Detected',
          severity: SecuritySeverity.HIGH,
          details: {
            ip: event.ipAddress,
            userAgent: event.userAgent,
            path: event.path,
          },
        });
      },
      severity: SecuritySeverity.HIGH,
    });

    // Data breach detection
    this.threatRules.push({
      name: 'Data Breach Detection',
      description: 'Detects potential data breaches',
      condition: (event) => event.type === SecurityEventType.DATA_BREACH,
      action: async (event) => {
        // Immediate response to data breach
        await this.initiateIncidentResponse('DATA_BREACH', event);
        await this.sendAlert({
          title: '🚨 CRITICAL: Potential Data Breach Detected',
          severity: SecuritySeverity.CRITICAL,
          details: event.details,
          immediate: true,
        });
      },
      severity: SecuritySeverity.CRITICAL,
    });
  }

  /**
   * Log security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    try {
      // Store in database for long-term audit
      await prisma.securityLog.create({
        data: {
          eventType: fullEvent.type,
          severity: fullEvent.severity,
          userId: fullEvent.userId,
          userEmail: fullEvent.userEmail,
          ipAddress: fullEvent.ipAddress,
          userAgent: fullEvent.userAgent,
          requestId: fullEvent.requestId,
          path: fullEvent.path,
          method: fullEvent.method,
          statusCode: fullEvent.statusCode,
          message: fullEvent.message,
          details: fullEvent.details ? JSON.stringify(fullEvent.details) : null,
          metadata: fullEvent.metadata ? JSON.stringify(fullEvent.metadata) : null,
        },
      });

      // Store in Redis for real-time analysis
      const key = `security:events:${fullEvent.type}:${Date.now()}`;
      await redis.set(key, JSON.stringify(fullEvent), 7 * 24 * 60 * 60); // 7 days

      // Apply threat detection rules
      for (const rule of this.threatRules) {
        if (rule.condition(fullEvent)) {
          await rule.action(fullEvent);
        }
      }

      // Log to monitoring service
      logger.securityEvent(fullEvent.type, {
        ip: fullEvent.ipAddress,
        userAgent: fullEvent.userAgent,
        endpoint: fullEvent.path,
        attemptedAction: fullEvent.message,
      });
    } catch (error) {
      logger.error('Failed to log security event', { event: fullEvent }, error as Error);
    }
  }

  /**
   * Block IP address
   */
  async blockIP(ip: string, reason: string, duration: number): Promise<void> {
    const key = `blocked:ip:${ip}`;
    await redis.set(key, JSON.stringify({ reason, blockedAt: Date.now() }), duration);

    logger.warn('IP address blocked', { ip, reason, duration });
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    const key = `blocked:ip:${ip}`;
    const blocked = await redis.get(key);
    return !!blocked;
  }

  /**
   * Send security alert
   */
  private async sendAlert(alert: {
    title: string;
    severity: SecuritySeverity;
    details: any;
    immediate?: boolean;
  }): Promise<void> {
    // Log alert
    logger.warn(`Security Alert: ${alert.title}`, {
      severity: alert.severity,
      ...alert.details,
    });

    // Send to monitoring service (e.g., Sentry, PagerDuty)
    if (alert.immediate || alert.severity === SecuritySeverity.CRITICAL) {
      // Implement immediate notification (email, SMS, Slack)
      // This would integrate with your notification service
    }

    // Store alert for dashboard
    await this.pushToRedisList('security:alerts', JSON.stringify({
      ...alert,
      timestamp: Date.now(),
    }));
  }

  /**
   * Initiate incident response
   */
  private async initiateIncidentResponse(
    type: string,
    event: SecurityEvent
  ): Promise<void> {
    const incident = {
      id: crypto.randomUUID(),
      type,
      severity: event.severity,
      startedAt: new Date(),
      event,
      status: 'ACTIVE',
    };

    // Store incident
    await prisma.securityIncident.create({
      data: {
        incidentId: incident.id,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        details: JSON.stringify(incident.event),
      },
    });

    // Trigger automated response based on type
    switch (type) {
      case 'DATA_BREACH':
        // Lock down affected systems
        // Revoke all active sessions
        // Enable read-only mode
        // Notify compliance team
        break;
      case 'BRUTE_FORCE':
        // Increase authentication requirements
        // Force password resets for affected accounts
        break;
      default:
        // General incident response
        break;
    }

    logger.error('Security incident initiated', incident);
  }

  /**
   * Get security metrics
   */
  async getMetrics(period: number = 24 * 60 * 60): Promise<any> {
    const now = Date.now();
    const since = new Date(now - period * 1000);

    const metrics = await prisma.securityLog.groupBy({
      by: ['eventType', 'severity'],
      where: {
        createdAt: { gte: since },
      },
      _count: true,
    });

    const blockedIPs = await this.getRedisKeys('blocked:ip:*');
    const activeIncidents = await prisma.securityIncident.count({
      where: { status: 'ACTIVE' },
    });

    return {
      period,
      events: metrics,
      blockedIPs: blockedIPs.length,
      activeIncidents,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze user behavior for anomalies
   */
  async analyzeUserBehavior(userId: string, action: string): Promise<void> {
    const key = `user:behavior:${userId}`;
    const history = await redis.get(key);
    const behaviors = history ? JSON.parse(history) : [];

    behaviors.push({
      action,
      timestamp: Date.now(),
    });

    // Keep last 100 actions
    if (behaviors.length > 100) {
      behaviors.shift();
    }

    await redis.set(key, JSON.stringify(behaviors), 30 * 24 * 60 * 60); // 30 days

    // Analyze for anomalies
    const anomalies = this.detectAnomalies(behaviors);
    if (anomalies.length > 0) {
      await this.logEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        userId,
        ipAddress: 'unknown',
        message: 'Anomalous user behavior detected',
        details: { anomalies },
      });
    }
  }

  /**
   * Detect anomalies in behavior patterns
   */
  /**
   * Helper method to increment Redis key with expiry
   */
  private async incrementRedisKey(key: string, expirySeconds: number): Promise<number> {
    try {
      // Use the existing Redis set/get pattern since increment isn't available
      const current = await redis.get(key);
      const count = current ? parseInt(current) + 1 : 1;
      await redis.set(key, count.toString(), expirySeconds);
      return count;
    } catch (error) {
      logger.error('Failed to increment Redis key', { key }, error as Error);
      return 1;
    }
  }

  /**
   * Helper method to push to Redis list (mock implementation)
   */
  private async pushToRedisList(key: string, value: string): Promise<void> {
    try {
      // Since lpush isn't available, store as a regular key with timestamp
      const listKey = `${key}:${Date.now()}`;
      await redis.set(listKey, value, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      logger.error('Failed to push to Redis list', { key }, error as Error);
    }
  }

  /**
   * Helper method to get Redis keys (mock implementation)
   */
  private async getRedisKeys(pattern: string): Promise<string[]> {
    try {
      // Since keys() isn't available in our Redis service, return empty array
      // In a real implementation, this would scan for matching keys
      return [];
    } catch (error) {
      logger.error('Failed to get Redis keys', { pattern }, error as Error);
      return [];
    }
  }

  private detectAnomalies(behaviors: any[]): string[] {
    const anomalies: string[] = [];

    // Rapid actions (possible automation)
    const recentActions = behaviors.filter(
      b => Date.now() - b.timestamp < 60000 // Last minute
    );
    if (recentActions.length > 20) {
      anomalies.push('Unusually rapid actions detected');
    }

    // Unusual time patterns
    const hourCounts: Record<number, number> = {};
    behaviors.forEach(b => {
      const hour = new Date(b.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Check for activity at unusual hours
    const nightActivity = Object.entries(hourCounts)
      .filter(([hour]) => {
        const h = parseInt(hour);
        return h >= 2 && h <= 5;
      })
      .reduce((sum, [, count]) => sum + count, 0);

    if (nightActivity > behaviors.length * 0.3) {
      anomalies.push('Unusual night-time activity pattern');
    }

    return anomalies;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(startDate: Date, endDate: Date): Promise<any> {
    const events = await prisma.securityLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const incidents = await prisma.securityIncident.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const summary = {
      period: {
        start: startDate,
        end: endDate,
      },
      totalEvents: events.length,
      totalIncidents: incidents.length,
      severityBreakdown: {} as Record<string, number>,
      topEventTypes: {} as Record<string, number>,
      topIPs: {} as Record<string, number>,
      recommendations: [] as string[],
    };

    // Analyze events
    events.forEach((event: any) => {
      // Severity breakdown
      const severityKey = event.severity as string;
      summary.severityBreakdown[severityKey] = (summary.severityBreakdown[severityKey] || 0) + 1;

      // Top event types
      const eventTypeKey = event.eventType as string;
      summary.topEventTypes[eventTypeKey] = (summary.topEventTypes[eventTypeKey] || 0) + 1;

      // Top IPs
      if (event.ipAddress) {
        const ipKey = event.ipAddress as string;
        summary.topIPs[ipKey] = (summary.topIPs[ipKey] || 0) + 1;
      }
    });

    // Generate recommendations
    if (summary.severityBreakdown['CRITICAL'] > 0) {
      summary.recommendations.push('Critical security events detected - immediate review required');
    }

    if (Object.keys(summary.topIPs).some(ip => summary.topIPs[ip] > 100)) {
      summary.recommendations.push('High activity from specific IPs - consider implementing stricter rate limiting');
    }

    return {
      summary,
      events: events.slice(0, 100), // Top 100 events
      incidents,
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper functions for common security events
export const SecurityLogger = {
  logLoginSuccess: (userId: string, email: string, ip: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      severity: SecuritySeverity.INFO,
      userId,
      userEmail: email,
      ipAddress: ip,
      message: 'User successfully logged in',
    }),

  logLoginFailed: (email: string, ip: string, reason: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.LOGIN_FAILED,
      severity: SecuritySeverity.LOW,
      userEmail: email,
      ipAddress: ip,
      message: `Login failed: ${reason}`,
    }),

  logUnauthorizedAccess: (path: string, ip: string, userId?: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ipAddress: ip,
      path,
      message: 'Unauthorized access attempt',
    }),

  logSQLInjection: (path: string, ip: string, payload: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.SQL_INJECTION_ATTEMPT,
      severity: SecuritySeverity.CRITICAL,
      ipAddress: ip,
      path,
      message: 'SQL injection attempt detected',
      details: { payload },
    }),

  logXSSAttempt: (path: string, ip: string, payload: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.XSS_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      ipAddress: ip,
      path,
      message: 'XSS attempt detected',
      details: { payload },
    }),

  logRateLimitExceeded: (ip: string, endpoint: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.LOW,
      ipAddress: ip,
      path: endpoint,
      message: 'Rate limit exceeded',
    }),

  logDataAccess: (userId: string, dataType: string, ip: string) =>
    securityMonitor.logEvent({
      type: SecurityEventType.SENSITIVE_DATA_ACCESS,
      severity: SecuritySeverity.INFO,
      userId,
      ipAddress: ip,
      message: `Sensitive data accessed: ${dataType}`,
      details: { dataType },
    }),
};

export default securityMonitor;