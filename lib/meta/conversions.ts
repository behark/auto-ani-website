import { createHash } from 'crypto';

import { env, hasMetaConversionsApi } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Meta Conversions API (server-side events).
 *
 * Sends events server-to-server to the Meta Graph API so conversions are
 * captured even when the browser Pixel is blocked (ad blockers, iOS ITP).
 * Events are deduplicated against the browser Pixel via a shared `event_id`.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const GRAPH_API_VERSION = 'v21.0';

// Supported standard event names we fire from this site.
export type MetaEventName = 'PageView' | 'Contact' | 'ViewContent' | 'Lead';

export interface MetaUserData {
  /** Raw email — will be normalized + SHA-256 hashed before sending. */
  email?: string;
  /** Raw phone — will be normalized + SHA-256 hashed before sending. */
  phone?: string;
  /** Meta browser id cookie (_fbp). Sent as-is, never hashed. */
  fbp?: string;
  /** Meta click id cookie (_fbc). Sent as-is, never hashed. */
  fbc?: string;
  /** Client IP address. Sent as-is, never hashed. */
  clientIpAddress?: string;
  /** Client user agent. Sent as-is, never hashed. */
  clientUserAgent?: string;
}

export interface MetaServerEvent {
  eventName: MetaEventName;
  /** Shared with the browser Pixel for deduplication. */
  eventId: string;
  /** Unix seconds. Defaults to now. */
  eventTime?: number;
  /** Full URL where the event happened. */
  eventSourceUrl?: string;
  actionSource?: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other';
  userData?: MetaUserData;
  customData?: Record<string, unknown>;
}

/** Normalize then SHA-256 hash a PII value per Meta's matching spec. */
function hash(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/** Phone numbers: strip everything but digits, then hash. */
function hashPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  return createHash('sha256').update(digits).digest('hex');
}

function buildUserData(userData: MetaUserData = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (userData.email) out.em = [hash(userData.email)];
  if (userData.phone) out.ph = [hashPhone(userData.phone)];
  if (userData.fbp) out.fbp = userData.fbp;
  if (userData.fbc) out.fbc = userData.fbc;
  if (userData.clientIpAddress) out.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) out.client_user_agent = userData.clientUserAgent;
  return out;
}

export interface SendResult {
  success: boolean;
  /** Skipped because the API isn't configured (not an error). */
  skipped?: boolean;
  error?: string;
  /** Meta's events_received count, when available. */
  eventsReceived?: number;
}

/**
 * Send one or more events to the Meta Conversions API.
 * Returns a result object instead of throwing, so callers (analytics) never
 * break the user-facing request.
 */
export async function sendMetaEvents(
  events: MetaServerEvent[]
): Promise<SendResult> {
  if (!hasMetaConversionsApi) {
    logger.debug('[Meta CAPI] Skipped — FACEBOOK_ACCESS_TOKEN / dataset id not configured');
    return { success: false, skipped: true };
  }

  const datasetId = env.FACEBOOK_DATASET_ID || env.NEXT_PUBLIC_FB_PIXEL_ID;
  const accessToken = env.FACEBOOK_ACCESS_TOKEN as string;

  const data = events.map((e) => ({
    event_name: e.eventName,
    event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: e.eventId,
    action_source: e.actionSource ?? 'website',
    ...(e.eventSourceUrl ? { event_source_url: e.eventSourceUrl } : {}),
    user_data: buildUserData(e.userData),
    ...(e.customData ? { custom_data: e.customData } : {}),
  }));

  const body: Record<string, unknown> = { data };
  // test_event_code routes events to the Events Manager "Test events" tab.
  if (env.META_TEST_EVENT_CODE) {
    body.test_event_code = env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/events?access_token=${encodeURIComponent(
    accessToken
  )}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = json?.error?.message || `HTTP ${res.status}`;
      logger.error('[Meta CAPI] Event send failed', { message });
      return { success: false, error: message };
    }

    logger.info('[Meta CAPI] Events sent', {
      events: events.map((e) => e.eventName),
      received: json.events_received,
    });
    return { success: true, eventsReceived: json.events_received };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Meta CAPI] Request error', { message });
    return { success: false, error: message };
  }
}
