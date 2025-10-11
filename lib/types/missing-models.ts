// Missing Prisma model types that are referenced in the codebase
// These are fallback types until they can be properly added to the Prisma schema

export interface ABTestStatus {
  id: string;
  testId: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  phoneNumbers: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  scheduledFor?: Date;
  sentAt?: Date;
  recipientCount: number;
  deliveryRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  templateId?: string;
  abTestId?: string;
  conversionGoal?: string;
  views: number;
  conversions: number;
  conversionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesTransaction {
  id: string;
  vehicleId?: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionType: 'SALE' | 'DEPOSIT' | 'REFUND';
  paymentMethod: string;
  paymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'OPENED' | 'CLICKED';
  provider: string;
  providerId?: string;
  errorMessage?: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSLog {
  id: string;
  phoneNumber: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
  provider: string;
  providerId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageAnalytics {
  id: string;
  pageUrl: string;
  pagePath: string;
  pageTitle?: string;
  views: number;
  uniqueViews: number;
  averageTimeOnPage?: number;
  bounceRate?: number;
  conversionRate?: number;
  date: Date;
  metadata?: string; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignMetrics {
  id: string;
  campaignId: string;
  campaignType: 'EMAIL' | 'SMS' | 'SOCIAL' | 'AD';
  impressions: number;
  clicks: number;
  conversions: number;
  cost?: number;
  revenue?: number;
  roi?: number;
  date: Date;
  metadata?: string; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  preferredLanguage?: string;
  communicationPreferences?: string; // JSON
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadScore {
  id: string;
  leadId: string;
  score: number;
  scoreBreakdown?: string; // JSON
  scoringModel: string;
  lastCalculatedAt: Date;
  factors?: string; // JSON
  createdAt: Date;
  updatedAt: Date;
}

// Additional types that might be referenced
export interface UserPreferences {
  id: string;
  userId: string;
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  preferences?: string; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingSegment {
  id: string;
  name: string;
  description?: string;
  criteria: string; // JSON
  isActive: boolean;
  memberCount: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationLog {
  id: string;
  leadId?: string;
  customerId?: string;
  type: 'EMAIL' | 'SMS' | 'CALL' | 'MEETING';
  direction: 'INBOUND' | 'OUTBOUND';
  subject?: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}