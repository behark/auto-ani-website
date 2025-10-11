// TODO: Install bull package when queue functionality is needed
// import Bull from 'bull';

// Temporary stub
const Bull = class {
  constructor(name: string, options: any) {}
  add(data: any, options?: any) { return Promise.resolve(); }
  process(fn: Function) {}
  on(event: string, fn: Function) {}
};

// Create lead processing queue
export const leadQueue = new Bull('lead processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: parseInt(process.env.QUEUE_MAX_RETRIES || '3'),
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job types
export const JOB_TYPES = {
  CALCULATE_LEAD_SCORE: 'calculateLeadScore',
  ASSIGN_LEAD: 'assignLead',
  SEND_FOLLOW_UP: 'sendFollowUp',
  UPDATE_SCORE: 'updateScore',
  BATCH_SCORE_UPDATE: 'batchScoreUpdate',
} as const;

// Export job data interfaces
export interface CalculateLeadScoreJob {
  customerId: string;
  source?: string;
  formSubmissionId?: string;
}

export interface AssignLeadJob {
  customerId: string;
  leadSource: string;
  leadScore: number;
  urgency: 'low' | 'medium' | 'high';
  formSubmissionId?: string;
}

export interface SendFollowUpJob {
  customerId: string;
  type: 'email' | 'sms' | 'call';
  templateId?: string;
  delay?: number;
}

export interface UpdateScoreJob {
  customerId: string;
  event: string;
  value: number;
}

export interface BatchScoreUpdateJob {
  customerIds: string[];
  reason: string;
}

// Default export
export default leadQueue;