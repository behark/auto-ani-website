import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakto AUTO ANI | Vetura Premium në Kosovë | +383 49 204 242',
  description: 'Kontaktoni AUTO ANI për vetura premium, finansim 0% dhe shërbim ekspërt. Vizitoni showroom-in tonë në Mitrovicë ose telefononi +383 49 204 242. Hapë Hën-Shtun.',
  keywords: 'kontakt AUTO ANI, showroom Mitrovicë, financim veturash, makina premium Kosovë, konsultim automotiv, test drive, garanci, shitje veturash',
  openGraph: {
    title: 'Kontakto AUTO ANI | Auto Salon Premium në Kosovë',
    description: 'Lidhuni me ne për vetura premium dhe mundësi financimi. Shërbim ekspërt në Kosovë. Mbi 2500 klientë të kënaqur.',
    type: 'website',
    url: 'https://autosalonani.com/contact',
    images: [
      {
        url: 'https://autosalonani.com/images/showroom.jpg',
        width: 1200,
        height: 630,
        alt: 'AUTO ANI Showroom - Kontaktoni për vetura premium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kontakto AUTO ANI | Vetura Premium Kosovë',
    description: 'Financim 0%, garanci dhe test drive falas. Vizitoni showroom-in tonë në Mitrovicë.',
  },
  alternates: {
    canonical: 'https://autosalonani.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}