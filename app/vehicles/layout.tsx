import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Our Premium Vehicle Collection | AUTO ANI',
  description: 'Explore our extensive collection of premium vehicles at AUTO ANI. BMW, Mercedes, Audi, Volkswagen, Toyota and more. Quality guaranteed, financing available in Pristina, Kosovo.',
  keywords: 'vehicles, cars, AUTO ANI, BMW, Mercedes, Audi, Volkswagen, Toyota, Pristina, Kosovo, quality cars, used cars, new cars',
  openGraph: {
    title: 'Premium Vehicle Collection | AUTO ANI',
    description: 'Quality vehicles with financing options. Browse BMW, Mercedes, Audi and more at Kosovo\'s trusted dealership.',
    type: 'website',
    images: [
      {
        url: 'https://autosalonani.com/images/hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'AUTO ANI Premium Vehicle Collection',
      },
    ],
  },
};

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}