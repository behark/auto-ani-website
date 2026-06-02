'use client';

/**
 * Browser-side Meta Pixel helpers.
 *
 * Every tracked event is sent twice with a shared `eventID`:
 *   1. via the Pixel (`fbq`) in the browser, and
 *   2. via our `/api/meta-events` route to the Conversions API on the server.
 * Meta deduplicates the pair using the shared id, so we get the reliability of
 * server-side tracking without double-counting.
 *
 * Docs: https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

type StandardEvent = 'PageView' | 'Contact' | 'ViewContent' | 'Lead';

// `window.fbq` is declared globally in env.d.ts.

function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface TrackOptions {
  /** Standard-event custom data (e.g. content_name, value, currency). */
  customData?: Record<string, unknown>;
  /** PII for server-side matching. Hashed on the server, never sent to fbq. */
  userData?: { email?: string; phone?: string };
  actionSource?: 'website' | 'chat' | 'phone_call';
}

/**
 * Fire a standard event through both the Pixel and the Conversions API,
 * deduplicated by a shared eventID.
 */
export function trackMetaEvent(eventName: StandardEvent, options: TrackOptions = {}): void {
  if (typeof window === 'undefined') return;

  const eventId = newEventId();
  const { customData, userData, actionSource } = options;

  // 1. Browser Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, customData ?? {}, { eventID: eventId });
  }

  // 2. Conversions API (fire-and-forget; never blocks the UI)
  const payload = {
    eventName,
    eventId,
    eventSourceUrl: window.location.href,
    actionSource: actionSource ?? 'website',
    customData,
    userData,
  };

  try {
    const body = JSON.stringify(payload);
    // keepalive lets the request survive a navigation (e.g. clicking a tel: link).
    void fetch('/api/meta-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics must never throw into the app.
  }
}
