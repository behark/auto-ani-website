'use client';

import { useEffect, useState } from 'react';
import { defaultFlags, type FeatureFlags } from '@/lib/feature-flags';

/**
 * Hook to check if a feature flag is enabled
 * Works with Vercel Feature Flags when deployed, uses defaults locally
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flagName: K
): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultFlags[flagName]);

  useEffect(() => {
    // In production with Vercel, flags come from edge config
    // For now, we'll use the default values defined in feature-flags.ts
    // Once connected to Vercel Dashboard, this will read from edge config

    // Check if we're in Vercel environment
    if (typeof window !== 'undefined') {
      // @ts-ignore - Vercel injects this globally
      const vercelFlags = window.__VERCEL_FLAGS__;

      if (vercelFlags && flagName in vercelFlags) {
        setIsEnabled(vercelFlags[flagName]);
      }
    }
  }, [flagName]);

  return isEnabled;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const vercelFlags = window.__VERCEL_FLAGS__;

      if (vercelFlags) {
        setFlags({ ...defaultFlags, ...vercelFlags });
      }
    }
  }, []);

  return flags;
}

/**
 * Server-side function to get feature flags
 * Use this in Server Components or API routes
 */
export async function getFeatureFlag<K extends keyof FeatureFlags>(
  flagName: K
): Promise<boolean> {
  // In production, this would fetch from Vercel Edge Config
  // For now, return default values
  return defaultFlags[flagName];
}
