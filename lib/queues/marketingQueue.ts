// Marketing Queue System for AUTO ANI Marketing Automation
// Uses Bull for reliable job processing with Redis

// TODO: Install bull package when queue functionality is needed
// import Queue from 'bull';

// Temporary stub with proper namespace
const Queue = class {
  constructor(name: string, redisUrl: string, options: any) {}
  add(jobType: string, data: any, options?: any) { return Promise.resolve(); }
  process(jobTypeOrFn: string | Function, concurrencyOrFn?: number | Function, fn?: Function) {}
  on(event: string, fn: Function) {}
  pause() { return Promise.resolve(); }
  resume() { return Promise.resolve(); }
  clean(grace: number, status: string) { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  getJobCounts() { return Promise.resolve({}); }
  getWaiting() { return Promise.resolve([]); }
  getActive() { return Promise.resolve([]); }
  getCompleted() { return Promise.resolve([]); }
  getFailed() { return Promise.resolve([]); }
  getDelayed() { return Promise.resolve([]); }
  name = 'mock-queue';
} as any;

// Add namespace stub
namespace Queue {
  export interface Job {
    id: string;
    data: any;
    opts: any;
    progress(progress: number): void;
  }
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Marketing queue for all marketing automation jobs
export const marketingQueue = new Queue('marketing automation', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
});

// Email queue for email campaigns
export const emailQueue = new Queue('email campaigns', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 5,           // Email delivery is critical - more retries
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// SMS queue for SMS campaigns
export const smsQueue = new Queue('sms campaigns', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// Social media queue for social posts
export const socialQueue = new Queue('social media', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,        // Social media APIs often have rate limits
    },
  },
});

// Lead scoring queue for processing lead scores
export const leadScoringQueue = new Queue('lead scoring', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

// Workflow execution queue
export const workflowQueue = new Queue('workflow execution', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job Types
export const JOB_TYPES = {
  // Email jobs
  SEND_EMAIL_CAMPAIGN: 'send_email_campaign',
  SEND_SINGLE_EMAIL: 'send_single_email',
  PROCESS_EMAIL_BOUNCE: 'process_email_bounce',

  // SMS jobs
  SEND_SMS_CAMPAIGN: 'send_sms_campaign',
  SEND_SINGLE_SMS: 'send_single_sms',

  // Social media jobs
  PUBLISH_SOCIAL_POST: 'publish_social_post',
  SCHEDULE_SOCIAL_POST: 'schedule_social_post',
  PUBLISH_SOCIAL_CAMPAIGN: 'publish_social_campaign',
  UPDATE_SOCIAL_METRICS: 'update_social_metrics',
  COLLECT_SOCIAL_METRICS: 'collect_social_metrics',

  // Lead scoring jobs
  CALCULATE_LEAD_SCORE: 'calculate_lead_score',
  UPDATE_LEAD_GRADES: 'update_lead_grades',

  // Workflow jobs
  EXECUTE_WORKFLOW: 'execute_workflow',
  PROCESS_TRIGGER: 'process_trigger',

  // Analytics jobs
  UPDATE_CAMPAIGN_METRICS: 'update_campaign_metrics',
  GENERATE_REPORTS: 'generate_reports',

  // Cleanup jobs
  CLEANUP_EXPIRED_DATA: 'cleanup_expired_data',
  ARCHIVE_OLD_CAMPAIGNS: 'archive_old_campaigns',
} as const;

// Job priority levels
export const JOB_PRIORITY = {
  CRITICAL: 1,    // Immediate processing (transactional emails)
  HIGH: 2,        // Within 5 minutes (hot lead notifications)
  NORMAL: 3,      // Within 30 minutes (campaign emails)
  LOW: 4,         // Within 2 hours (bulk operations)
  BACKGROUND: 5,  // When system is idle (analytics, cleanup)
} as const;

// Helper function to add jobs with proper typing
export const addMarketingJob = async (
  type: keyof typeof JOB_TYPES,
  data: Record<string, unknown>,
  options?: {
    priority?: number;
    delay?: number;
    repeat?: Record<string, unknown>;
    attempts?: number;
  }
) => {
  const jobType = JOB_TYPES[type];

  // Route to appropriate queue based on job type
  let queue: any;

  if (jobType.includes('email')) {
    queue = emailQueue;
  } else if (jobType.includes('sms')) {
    queue = smsQueue;
  } else if (jobType.includes('social')) {
    queue = socialQueue;
  } else if (jobType.includes('lead')) {
    queue = leadScoringQueue;
  } else if (jobType.includes('workflow')) {
    queue = workflowQueue;
  } else {
    queue = marketingQueue;
  }

  return queue.add(jobType, data, {
    priority: options?.priority || JOB_PRIORITY.NORMAL,
    delay: options?.delay,
    repeat: options?.repeat,
    attempts: options?.attempts,
  });
};

// Recurring job schedules
export const RECURRING_JOBS = {
  // Lead scoring updates every hour
  LEAD_SCORING_UPDATE: {
    cron: '0 * * * *', // Every hour
    type: 'UPDATE_LEAD_GRADES' as const,
    data: {},
    options: { priority: JOB_PRIORITY.BACKGROUND }
  },

  // Campaign metrics update every 15 minutes
  METRICS_UPDATE: {
    cron: '*/15 * * * *', // Every 15 minutes
    type: 'UPDATE_CAMPAIGN_METRICS' as const,
    data: {},
    options: { priority: JOB_PRIORITY.LOW }
  },

  // Daily cleanup at 2 AM
  DAILY_CLEANUP: {
    cron: '0 2 * * *', // 2 AM every day
    type: 'CLEANUP_EXPIRED_DATA' as const,
    data: {},
    options: { priority: JOB_PRIORITY.BACKGROUND }
  },

  // Weekly campaign archive on Sundays at 3 AM
  WEEKLY_ARCHIVE: {
    cron: '0 3 * * 0', // 3 AM every Sunday
    type: 'ARCHIVE_OLD_CAMPAIGNS' as const,
    data: {},
    options: { priority: JOB_PRIORITY.BACKGROUND }
  },
} as const;

// Set up recurring jobs
export const setupRecurringJobs = async () => {
  for (const [jobName, config] of Object.entries(RECURRING_JOBS)) {
    try {
      await addMarketingJob(
        config.type,
        config.data,
        {
          ...config.options,
          repeat: { cron: config.cron }
        }
      );
      console.log(`Scheduled recurring job: ${jobName}`);
    } catch (error) {
      console.error(`Failed to schedule recurring job ${jobName}:`, error);
    }
  }
};

// Queue monitoring and health checks
export const getQueueHealth = async () => {
  const queues = [
    { name: 'marketing', queue: marketingQueue },
    { name: 'email', queue: emailQueue },
    { name: 'sms', queue: smsQueue },
    { name: 'social', queue: socialQueue },
    { name: 'leadScoring', queue: leadScoringQueue },
    { name: 'workflow', queue: workflowQueue },
  ];

  const health = [];

  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      health.push({
        name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        isHealthy: failed.length < 10, // Consider unhealthy if >10 failed jobs
      });
    } catch (error) {
      health.push({
        name,
        error: (error as Error).message,
        isHealthy: false,
      });
    }
  }

  return health;
};

// Export all queues for worker processes
export const allQueues = {
  marketing: marketingQueue,
  email: emailQueue,
  sms: smsQueue,
  social: socialQueue,
  leadScoring: leadScoringQueue,
  workflow: workflowQueue,
};

// Graceful shutdown
export const shutdownQueues = async () => {
  console.log('Shutting down marketing queues...');

  const shutdownPromises = Object.values(allQueues).map(queue =>
    queue.close()
  );

  await Promise.all(shutdownPromises);
  console.log('All marketing queues shut down');
};

// Error handling for queues
Object.values(allQueues).forEach(queue => {
  queue.on('error', (error: any) => {
    console.error(`Queue ${queue.name} error:`, error);
  });

  queue.on('stalled', (job: any) => {
    console.warn(`Job ${job.id} in queue ${queue.name} stalled`);
  });
});

const marketingQueueExports = {
  addMarketingJob,
  getQueueHealth,
  setupRecurringJobs,
  shutdownQueues,
  allQueues,
  JOB_TYPES,
  JOB_PRIORITY,
};

export default marketingQueueExports;