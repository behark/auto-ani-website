import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Vehicles | AUTO ANI Vehicle Comparison Tool',
  description: 'Compare up to 3 vehicles side-by-side at AUTO ANI. Compare prices, specifications, features and more to find your perfect car in Kosovo.',
  keywords: 'vehicle comparison, compare cars, AUTO ANI comparison tool, car specifications, vehicle features Kosovo',
  openGraph: {
    title: 'Vehicle Comparison Tool | AUTO ANI',
    description: 'Compare vehicles side-by-side to find your perfect match. Easy comparison tool for all our premium vehicles.',
    type: 'website',
    images: [
      {
        url: 'https://autosalonani.com/images/cover.jpg',
        width: 1200,
        height: 630,
        alt: 'AUTO ANI Vehicle Comparison Tool',
      },
    ],
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}