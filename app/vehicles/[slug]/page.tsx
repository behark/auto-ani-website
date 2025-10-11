import { notFound } from 'next/navigation';
import VehicleDetailClient from './VehicleDetailClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface VehicleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic metadata for each vehicle
export async function generateMetadata({ params }: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Use API instead of Prisma
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';
    const response = await fetch(`${baseUrl}/api/vehicles/${slug}`);
    if (!response.ok) {
      throw new Error('Vehicle not found');
    }
    const data = await response.json();
    const vehicle = data.vehicle;

    if (!vehicle) {
      return {
        title: 'Vetura nuk u gjet | AUTO ANI',
        description: 'Vetura që kërkoni nuk është disponueshme. Shikoni koleksionin tonë të plotë të veturave premium në AUTO ANI.',
      };
    }

    const images = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
    const mainImage = images && images.length > 0 ? images[0] : null;

    const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} | €${vehicle.price.toLocaleString()} | AUTO ANI`;
    const description = `${vehicle.year} ${vehicle.make} ${vehicle.model} në shitje në AUTO ANI. Çmim: €${vehicle.price.toLocaleString()}, ${vehicle.mileage.toLocaleString()} km, ${vehicle.fuelType}, ${vehicle.transmission}. Test drive, financim dhe garanci të disponueshme.`;

    return {
      title,
      description,
      keywords: `${vehicle.make} ${vehicle.model}, ${vehicle.year} ${vehicle.make}, vetura shitje, ${vehicle.fuelType} ${vehicle.transmission}, AUTO ANI, ${vehicle.bodyType}, makina ${vehicle.make}`,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://autosalonani.com/vehicles/${vehicle.slug || vehicle.id}`,
        images: mainImage ? [
          {
            url: mainImage.startsWith('http') ? mainImage : `https://autosalonani.com${mainImage}`,
            width: 1200,
            height: 630,
            alt: `${vehicle.year} ${vehicle.make} ${vehicle.model} - AUTO ANI`,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: description.substring(0, 160),
      },
      alternates: {
        canonical: `https://autosalonani.com/vehicles/${vehicle.slug || vehicle.id}`,
      },
    };
  } catch (error) {
    return {
      title: 'Vetura | AUTO ANI',
      description: 'Zbuloni koleksionin tonë të veturave premium në AUTO ANI.',
    };
  }
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  // Fix for Next.js 15: await params before accessing properties
  const { slug } = await params;

  try {
    // Use API instead of Prisma
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';
    const response = await fetch(`${baseUrl}/api/vehicles/${slug}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`API call failed: ${response.status}`);
      notFound();
    }

    const data = await response.json();
    const vehicle = data.vehicle;

    if (!vehicle) {
      notFound();
    }

    return <VehicleDetailClient vehicle={vehicle} />;
  } catch (error) {
    console.error('Error loading vehicle:', error);
    notFound();
  }
}