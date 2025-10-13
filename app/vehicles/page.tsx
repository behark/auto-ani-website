import type { Metadata } from 'next';

import VehiclesPageClient from '@/components/vehicles/VehiclesPageClient';
import type { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/vehicles`, {
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success && data.data.vehicles ? data.data.vehicles : [];
  } catch (error) {
    console.error('Failed to fetch vehicles on server:', error);
    return [];
  }
}

export default async function VehiclesPage() {
  const serverVehicles = await getVehicles();

  return <VehiclesPageClient initialVehicles={serverVehicles} />;
}
