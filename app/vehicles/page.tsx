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
    // ✅ Direct Sanity fetch on server - no HTTP roundtrip needed
    const { client } = await import('@/lib/sanity');

    // ✅ OPTIMIZED: Fetch images with CDN transformations built into URL
    // This creates optimized thumbnail URLs directly from Sanity CDN
    const query = `*[_type == "vehicle"] {
      _id,
      title,
      slug,
      brand,
      model,
      year,
      price,
      mileage,
      category,
      featured,
      description,
      fuelType,
      transmission,
      color,
      engine,
      "mainImage": mainImage.asset->url + "?w=800&h=600&fit=crop&fm=webp&q=90",
      "thumbnail": mainImage.asset->url + "?w=600&h=400&fit=crop&fm=webp&q=85",
      "gallery": gallery[].asset->url + "?w=800&h=600&fit=crop&fm=webp&q=90",
      _createdAt
    } | order(_createdAt desc)`;

    const vehicles = await client.fetch(query);
    console.log(`Server fetched ${vehicles?.length || 0} vehicles with optimized images`);
    return vehicles || [];
  } catch (error) {
    console.error('Failed to fetch vehicles on server:', error);
    // Return empty array to let client-side handle it
    return [];
  }
}

export default async function VehiclesPage() {
  // Generate vehicles page schema
  const schemas = generatePageSchemas('vehicles');

  // ✅ Fetch vehicles on server for instant render
  const initialVehicles = await getVehicles();

  return (
    <>
      <StructuredData schemas={schemas} />
      <VehiclesPageClient initialVehicles={initialVehicles} />
    </>
  );
}
