import { NextRequest, NextResponse } from 'next/server';

import { sendMetaEvents, type MetaEventName, type MetaServerEvent } from '@/lib/meta/conversions';

// Server-to-server forwarding to the Meta Conversions API. Must run on every
// request (no caching) and read request headers/cookies.
export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS: MetaEventName[] = ['PageView', 'Contact', 'ViewContent', 'Lead'];

interface IncomingEvent {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: MetaServerEvent['actionSource'];
  customData?: Record<string, unknown>;
  userData?: { email?: string; phone?: string };
}

/** Best-effort client IP from common proxy headers (Vercel sets these). */
function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || undefined;
}

export async function POST(request: NextRequest) {
  let payload: IncomingEvent;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const { eventName, eventId } = payload;

  if (!eventName || !ALLOWED_EVENTS.includes(eventName as MetaEventName)) {
    return NextResponse.json({ success: false, message: 'Unsupported event' }, { status: 400 });
  }
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ success: false, message: 'Missing eventId' }, { status: 400 });
  }

  // Meta matching/dedup signals. _fbp and _fbc are set by the browser Pixel.
  const userAgent = request.headers.get('user-agent') || undefined;
  const clientIp = getClientIp(request);
  const fbp = request.cookies.get('_fbp')?.value;
  const fbc = request.cookies.get('_fbc')?.value;

  const event: MetaServerEvent = {
    eventName: eventName as MetaEventName,
    eventId,
    eventSourceUrl: payload.eventSourceUrl || request.headers.get('referer') || undefined,
    actionSource: payload.actionSource ?? 'website',
    userData: {
      email: payload.userData?.email,
      phone: payload.userData?.phone,
      fbp,
      fbc,
      clientIpAddress: clientIp,
      clientUserAgent: userAgent,
    },
    customData: payload.customData,
  };

  const result = await sendMetaEvents([event]);

  // Never surface an error to the browser for an analytics call — a failed
  // CAPI send must not break the page. 200 with a body either way.
  return NextResponse.json(result, { status: 200 });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
