import type { Metadata } from 'next';

import StructuredData from '@/components/seo/StructuredData';
import VehiclesPageClient from '@/components/vehicles/VehiclesPageClient';
import { logger } from '@/lib/logger';
import { generatePageSchemas } from '@/lib/seo-schema';
import { vehicleHelpers } from '@/data/vehicles';

// Static page - no revalidation needed with hardcoded data
// Remove ISR since we're using static data now
// export const revalidate = CACHE.REVALIDATION_TIME; // Removed - no longer needed

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
    // Get vehicles from hardcoded data - instant, no network call
    const vehicles = vehicleHelpers.getAvailable();

    // Sort by featured first, then by date
    const sorted = vehicles.sort((a, b) => {
      // Featured vehicles first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then sort by date
      const dateA = new Date(a.dateAdded || a._createdAt || '');
      const dateB = new Date(b.dateAdded || b._createdAt || '');
      return dateB.getTime() - dateA.getTime();
    });

    logger.info(`Loaded ${sorted.length} vehicles from hardcoded data`);
    return sorted;
  } catch (error) {
    logger.error('Failed to load vehicles:', { error });
    return [];
  }
}

export default async function VehiclesPage() {
  // Generate vehicles page schema
  const schemas = generatePageSchemas('vehicles');

  // Get vehicles from hardcoded data
  const initialVehicles = await getVehicles();

  return (
    <>
      <StructuredData schemas={schemas} />
      <VehiclesPageClient initialVehicles={initialVehicles} />
    </>
  );
}
