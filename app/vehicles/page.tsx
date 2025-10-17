import type { Metadata } from 'next';

import VehiclesPageClient from '@/components/vehicles/VehiclesPageClient';
import StructuredData from '@/components/seo/StructuredData';
import { generatePageSchemas } from '@/lib/seo-schema';
import type { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // seconds

export const metadata: Metadata = {
  title: "Vetura në Shitje | AUTO ANI - Premium Auto Salon Kosovë",
  description: "Zbuloni koleksionin tonë të veturave premium në AUTO ANI. BMW, Mercedes, Audi, VW, Toyota. Finansim 0%, garanci, test drive. Mbi 2500 klientë të kënaqur në Mitrovicë, Kosovë.",
  keywords: "vetura shitje, makina Kosovë, AUTO ANI, BMW, Mercedes, Audi, Volkswagen, Toyota, vetura përdorura, auto salon Mitrovicë, financim makina, test drive",
  openGraph: {
    title: "Vetura Premium në Shitje | AUTO ANI",
    description: "Koleksion i gjerë veturash premium. Finansim të favorshëm, garanci dhe test drive falas. Vizitoni AUTO ANI në Mitrovicë.",
    type: "website",
    url: "https://autosalonani.com/vehicles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vetura Premium në Shitje | AUTO ANI",
    description: "Koleksion i gjerë veturash premium. Finansim të favorshëm, garanci dhe test drive falas.",
  },
  alternates: {
    canonical: "https://autosalonani.com/vehicles",
  },
};

async function getVehicles() {
  try {
    // Try multiple base URL sources
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                   process.env.RENDER_EXTERNAL_URL ||
                   'https://auto-ani-simple.onrender.com';

    const response = await fetch(`${baseUrl}/api/vehicles`, {
      cache: 'no-store', // Ensure fresh data
      headers: {
        'User-Agent': 'Next.js Server',
      },
    });

    if (!response.ok) {
      console.warn(`Server fetch failed (${response.status}): ${response.statusText}`);
      // Return empty array to let client-side handle it
      return [];
    }

    const data = await response.json();
    console.log(`Server fetched ${data?.data?.vehicles?.length || 0} vehicles`);
    return data.success && data.data.vehicles ? data.data.vehicles : [];
  } catch (error) {
    console.error('Failed to fetch vehicles on server:', error);
    // Return empty array to let client-side handle it
    return [];
  }
}

export default function VehiclesPage() {
  // Generate vehicles page schema
  const schemas = generatePageSchemas('vehicles');

  // Force client-side rendering to ensure vehicles display
  console.log('VehiclesPage: Rendering client-side only');
  return (
    <>
      <StructuredData schemas={schemas} />
      <VehiclesPageClient initialVehicles={[]} />
    </>
  );
}
