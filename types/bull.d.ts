declare module 'bull' {
  import { EventEmitter } from 'events';

  export interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    repeat?: RepeatOptions;
    backoff?: BackoffOptions | string | number;
    lifo?: boolean;
    timeout?: number;
    removeOnComplete?: number | boolean;
    removeOnFail?: number | boolean;
    jobId?: string;
  }

  export interface RepeatOptions {
    cron?: string;
    timezone?: string;
    startDate?: Date | string | number;
    endDate?: Date | string | number;
    limit?: number;
    every?: number;
    count?: number;
  }

  export interface BackoffOptions {
    type: string;
    delay?: number;
    attempts?: number;
  }

  export interface JobProgress {
    completed: number;
    total: number;
    data?: any;
  }

  export class Job<T = any> extends EventEmitter {
    id: string | number | undefined;
    data: T;
    opts: JobOptions;
    progress: number;
    delay: number;
    timestamp: number;
    attemptsMade: number;
    stacktrace: string[];
    returnvalue: any;
    failedReason: string;
    processedOn?: number;
    finishedOn?: number;

    constructor(queue: Queue, name: string, data: T, opts?: JobOptions);

    progress(): number;
    progress(progress: number | JobProgress): Promise<void>;
    log(row: string): Promise<number>;
    getState(): Promise<JobStatus>;
    update(data: T): Promise<void>;
    remove(): Promise<void>;
    retry(): Promise<void>;
    discard(): Promise<void>;
    promote(): Promise<void>;
  }

  export type JobStatus =
    | 'completed'
    | 'waiting'
    | 'active'
    | 'delayed'
    | 'failed'
    | 'paused'
    | 'stuck';

  export interface QueueOptions {
    redis?: {
      port?: number;
      host?: string;
      password?: string;
      db?: number;
    };
    prefix?: string;
    defaultJobOptions?: JobOptions;
    settings?: QueueSettings;
  }

  export interface QueueSettings {
    stalledInterval?: number;
    maxStalledCount?: number;
    retryProcessDelay?: number;
  }

  export interface ProcessPromiseFunction<T = any> {
    (job: Job<T>): Promise<any>;
  }

  export interface ProcessCallbackFunction<T = any> {
    (job: Job<T>, done: DoneCallback): void;
  }

  export interface DoneCallback {
    (error?: Error | null, result?: any): void;
  }

  export declare namespace Queue {
    interface Queue<T = any> extends EventEmitter {
      name: string;

      add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
      add(data: T, opts?: JobOptions): Promise<Job<T>>;

      process(concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
      process(name: string, concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
      process(processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
      process(name: string, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;

      empty(): Promise<void>;
      close(doNotWaitActive?: boolean): Promise<void>;
      getJob(jobId: string | number): Promise<Job<T> | null>;
      getJobs(types: JobStatus[], start?: number, end?: number, asc?: boolean): Promise<Job<T>[]>;
      getJobCounts(): Promise<{ [index: string]: number }>;
      clean(grace: number, status?: JobStatus, limit?: number): Promise<Job<T>[]>;

      pause(isLocal?: boolean): Promise<void>;
      resume(isLocal?: boolean): Promise<void>;

      count(): Promise<number>;

      on(event: 'ready', listener: () => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      on(event: 'active', listener: (job: Job<T>, jobPromise?: Promise<any>) => void): this;
      on(event: 'stalled', listener: (job: Job<T>) => void): this;
      on(event: 'progress', listener: (job: Job<T>, progress: any) => void): this;
      on(event: 'completed', listener: (job: Job<T>, result: any) => void): this;
      on(event: 'failed', listener: (job: Job<T>, err: Error) => void): this;
      on(event: 'paused', listener: () => void): this;
      on(event: 'resumed', listener: () => void): this;
      on(event: 'cleaned', listener: (jobs: Job<T>[], type: string) => void): this;
      on(event: 'drained', listener: () => void): this;
      on(event: 'removed', listener: (job: Job<T>) => void): this;
      on(event: 'waiting', listener: (jobId: string | number) => void): this;
      on(event: string, listener: Function): this;

      once(event: 'ready', listener: () => void): this;
      once(event: 'error', listener: (error: Error) => void): this;
      once(event: 'active', listener: (job: Job<T>, jobPromise?: Promise<any>) => void): this;
      once(event: 'stalled', listener: (job: Job<T>) => void): this;
      once(event: 'progress', listener: (job: Job<T>, progress: any) => void): this;
      once(event: 'completed', listener: (job: Job<T>, result: any) => void): this;
      once(event: 'failed', listener: (job: Job<T>, err: Error) => void): this;
      once(event: 'paused', listener: () => void): this;
      once(event: 'resumed', listener: () => void): this;
      once(event: 'cleaned', listener: (jobs: Job<T>[], type: string) => void): this;
      once(event: 'drained', listener: () => void): this;
      once(event: 'removed', listener: (job: Job<T>) => void): this;
      once(event: 'waiting', listener: (jobId: string | number) => void): this;
      once(event: string, listener: Function): this;
    }
  }

  export class Queue<T = any> extends EventEmitter implements Queue.Queue<T> {
    name: string;

    constructor(name: string, opts?: QueueOptions);
    constructor(name: string, url?: string, opts?: QueueOptions);

    add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
    add(data: T, opts?: JobOptions): Promise<Job<T>>;

    process(concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(name: string, concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(name: string, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;

    empty(): Promise<void>;
    close(doNotWaitActive?: boolean): Promise<void>;
    getJob(jobId: string | number): Promise<Job<T> | null>;
    getJobs(types: JobStatus[], start?: number, end?: number, asc?: boolean): Promise<Job<T>[]>;
    getJobCounts(): Promise<{ [index: string]: number }>;
    clean(grace: number, status?: JobStatus, limit?: number): Promise<Job<T>[]>;

    pause(isLocal?: boolean): Promise<void>;
    resume(isLocal?: boolean): Promise<void>;

    count(): Promise<number>;
  }

  export default Queue;
}