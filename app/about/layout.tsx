import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rreth Nesh | AUTO ANI - 9+ Vjet Ekspertizë në Industrinë Automotiv',
  description: 'Njihuni me historinë e AUTO ANI. Që nga 2015, kemi shitur mbi 2500 vetura dhe kemi ndërtuar besimin e klientëve në Kosovë. Ekip ekspertësh, shërbim profesional dhe përkushtim për cilësi.',
  keywords: 'rreth AUTO ANI, histori kompanie, ekspertizë automotiv, auto salon Kosovë, ekip profesional, mision vizion, vlera kompanie, përvojë 9 vjet',
  openGraph: {
    title: 'Rreth AUTO ANI | Ekspertë në Industrinë Automotiv që nga 2015',
    description: 'Zbuloni historinë tonë të suksesit. Mbi 2500 vetura të shitura, mijëra klientë të kënaqur dhe përkushtim i pandërprerë për cilësi.',
    type: 'website',
    url: 'https://autosalonani.com/about',
    images: [
      {
        url: 'https://autosalonani.com/images/team.jpg',
        width: 1200,
        height: 630,
        alt: 'Ekipi i AUTO ANI - Profesionistë të industrisë automotiv',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rreth AUTO ANI | 9+ Vjet Ekspertizë Automotiv',
    description: 'Zbuloni historinë tonë të suksesit në industrinë automotiv të Kosovës.',
  },
  alternates: {
    canonical: 'https://autosalonani.com/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}