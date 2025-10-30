import { MetadataRoute } from 'next';

import { client } from '@/lib/sanity';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://autosalonani.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/vehicles`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trade-in`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ];

  // Fetch dynamic vehicle pages from Sanity
  let vehiclePages: MetadataRoute.Sitemap = [];

  try {
    const vehicles = await client.fetch(
      `*[_type == "vehicle"] {
        "slug": slug.current,
        _updatedAt
      } | order(_updatedAt desc)`,
      {},
      {
        next: {
          revalidate: 3600, // Cache for 1 hour
        }
      }
    );

    vehiclePages = vehicles.map((vehicle: { slug: string; _updatedAt: string }) => ({
      url: `${baseUrl}/vehicles/${vehicle.slug}`,
      lastModified: new Date(vehicle._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching vehicles for sitemap:', error);
  }

  return [...staticPages, ...vehiclePages];
}