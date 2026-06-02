'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense, useEffect, useRef } from 'react';

import { META_PIXEL_ID, trackMetaEvent } from '@/lib/meta/pixel';

/**
 * Loads the Meta Pixel and fires deduplicated PageView + Contact events.
 *
 * - PageView fires on initial load and on every client-side route change.
 * - Contact fires (once per click) when a user clicks any WhatsApp link,
 *   `tel:` link, or element marked with `data-meta-contact`, anywhere on the
 *   site — so we don't have to instrument each widget individually.
 *
 * No-ops cleanly when NEXT_PUBLIC_FB_PIXEL_ID is unset.
 */

const CONTACT_SELECTOR =
  'a[href^="tel:"], a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href^="whatsapp:"], [data-meta-contact]';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Skip the very first effect run: the Pixel base code already sent the
  // initial PageView via fbq('track', 'PageView'). We only fire on navigation.
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    trackMetaEvent('PageView');
  }, [pathname, searchParams]);

  return null;
}

function ContactTracker() {
  useEffect(() => {
    if (!META_PIXEL_ID) return;

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const match = target?.closest(CONTACT_SELECTOR);
      if (!match) return;

      const href = match.getAttribute('href') || '';
      const channel = href.startsWith('tel:')
        ? 'phone'
        : /wa\.me|whatsapp/i.test(href) || match.hasAttribute('data-meta-contact')
          ? 'whatsapp'
          : 'other';

      trackMetaEvent('Contact', {
        actionSource: channel === 'phone' ? 'phone_call' : 'chat',
        customData: { contact_method: channel },
      });
    }

    // Capture phase so we record the click even if the handler navigates away.
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}

export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* Meta's required 1x1 fallback pixel — must be a raw <img> inside <noscript>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ContactTracker />
    </>
  );
}
