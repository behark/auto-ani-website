/**
 * Environment Variable Validation for AUTO ANI Website
 * Ensures all required environment variables are present and correctly formatted
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Sanity CMS (private)
  SANITY_API_TOKEN: z.string().optional(), // Optional - only needed for write operations

  // Email services (optional)
  RESEND_API_KEY: z.string().optional(),
  CONTACT_EMAIL: z.string().email().optional(),

  // Deployment
  PORT: z.string().regex(/^\d+$/).default('3000'),

  // Revalidation secret
  REVALIDATE_SECRET: z.string().optional(),

  // Error tracking (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser (must start with NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  // Sanity CMS (public)
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, 'Sanity Project ID is required'),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production'),

  // Contact information
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().regex(/^\+?\d+$/, 'Invalid WhatsApp number format'),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email('Invalid contact email'),
  NEXT_PUBLIC_PHONE_NUMBER: z.string().regex(/^\+?\d+$/, 'Invalid phone number format'),

  // Optional features
  NEXT_PUBLIC_UNOPTIMIZED_IMAGES: z.string().optional(),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = z.object({
  ...serverEnvSchema.shape,
  ...clientEnvSchema.shape,
});

/**
 * Type definitions for environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate server environment variables
 * Only run on server side
 */
export function validateServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv should only be called on the server side');
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors
    );
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validate client environment variables
 * Can be run on both client and server
 */
export function validateClientEnv(): ClientEnv {
  const env = {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_PHONE_NUMBER: process.env.NEXT_PUBLIC_PHONE_NUMBER,
    NEXT_PUBLIC_UNOPTIMIZED_IMAGES: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES,
  };

  const parsed = clientEnvSchema.safeParse(env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid client environment variables:',
      parsed.error.flatten().fieldErrors
    );
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

/**
 * Validate all environment variables
 * Only run on server side
 */
export function validateEnv(): Env {
  if (typeof window !== 'undefined') {
    throw new Error('validateEnv should only be called on the server side');
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors
    );

    // Provide helpful error messages
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages: string[] = [];

    for (const [key, messages] of Object.entries(errors)) {
      if (messages && messages.length > 0) {
        errorMessages.push(`  ${key}: ${messages.join(', ')}`);
      }
    }

    if (errorMessages.length > 0) {
      console.error('Please fix the following environment variables:');
      console.error(errorMessages.join('\n'));
      console.error('\nRefer to .env.example for the correct format.');
    }

    throw new Error('Invalid environment variables. Check the console for details.');
  }

  return parsed.data;
}

/**
 * Cached environment variables
 * Validate once and export for use throughout the app
 */
let cachedServerEnv: ServerEnv | undefined;
let cachedClientEnv: ClientEnv | undefined;

/**
 * Get validated server environment variables
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv should only be called on the server side');
  }

  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv();
  }

  return cachedServerEnv;
}

/**
 * Get validated client environment variables
 */
export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = validateClientEnv();
  }

  return cachedClientEnv;
}

/**
 * Type-safe environment variable access
 */
export const env = new Proxy({} as Env, {
  get(target, prop: string) {
    if (typeof window === 'undefined') {
      // Server side - access all env vars
      return process.env[prop];
    } else {
      // Client side - only access NEXT_PUBLIC_ vars
      if (prop.startsWith('NEXT_PUBLIC_')) {
        return process.env[prop];
      }
      console.warn(`Attempted to access server-only env var "${prop}" on client side`);
      return undefined;
    }
  },
});

/**
 * Export default validated environment
 * This will throw an error if validation fails during module load
 */
export default typeof window === 'undefined' ? getServerEnv() : getClientEnv();