import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financim Veturash | AUTO ANI - 0% Kamat, Kushte të Lehta, Aprovim i Shpejtë',
  description: 'Financim veturash me kushte të shkëlqyera në AUTO ANI. 0% kamat për klientë të përzgjedhur, këste të ulëta mujore, aprovim brenda 24 orësh. Kalkulatori i financimit falas online.',
  keywords: 'financim veturash, kredit makina, 0% kamat, këste mujore, aprovim i shpejtë, kalkulatori financimi, hua për vetura, leasing auto, kushte të favorshme',
  openGraph: {
    title: 'Financim Veturash me 0% Kamat | AUTO ANI',
    description: 'Kushte të shkëlqyera financimi për veturën e ëndrrave tuaja. Kalkuloni këste mujore dhe aplikoni online.',
    type: 'website',
    url: 'https://autosalonani.com/financing',
    images: [
      {
        url: 'https://autosalonani.com/images/financing.jpg',
        width: 1200,
        height: 630,
        alt: 'Financim Veturash me Kushte të Favorshme - AUTO ANI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financim Veturash me 0% Kamat | AUTO ANI',
    description: 'Kushte të shkëlqyera financimi dhe aprovim i shpejtë për veturën tuaj.',
  },
  alternates: {
    canonical: 'https://autosalonani.com/financing',
  },
};

export default function FinancingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}