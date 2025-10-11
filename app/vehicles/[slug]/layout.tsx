import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params; // Extract id parameter (currently unused but ready for future vehicle-specific metadata)

  // In a real app, you'd fetch the vehicle data here
  // For now, we'll use a generic template

  return {
    title: `Vehicle Details | AUTO ANI Premium Cars`,
    description: `View detailed specifications, images, and pricing for this premium vehicle at AUTO ANI. Quality guaranteed, financing available in Kosovo.`,
    keywords: 'vehicle details, car specifications, AUTO ANI, premium vehicles, Kosovo, financing available',
    openGraph: {
      title: 'Premium Vehicle | AUTO ANI',
      description: 'Quality vehicle with detailed specifications and competitive pricing.',
      type: 'website',
    },
  };
}

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}