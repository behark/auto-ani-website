import type { Metadata } from 'next';

import EnhancedAboutPage from '@/components/EnhancedAboutPage';

export const metadata: Metadata = {
  title: "Rreth Nesh | AUTO ANI - Historia dhe Vlerat Tona",
  description: "Njihuni me AUTO ANI, kompania më e besuar e shitjes së veturave në Kosovë. Mbi 15 vjet përvojë, 2500+ klientë të kënaqur. Ekspertiza, transparenca dhe shërbim i shkëlqyer.",
  openGraph: {
    title: "Rreth Nesh | AUTO ANI",
    description: "Njihuni me kompaninë tonë, historinë dhe vlerat që na bëjnë liderë në shitjen e veturave premium në Kosovë.",
    type: "website",
    url: "https://autosalonani.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rreth Nesh | AUTO ANI",
    description: "Njihuni me kompaninë tonë, historinë dhe vlerat që na bëjnë liderë në shitjen e veturave premium në Kosovë.",
  },
  alternates: {
    canonical: "https://autosalonani.com/about",
  },
};

export default function AboutPage() {
  return <EnhancedAboutPage />;
}