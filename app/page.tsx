import { Suspense } from 'react';

import FeaturedVehiclesServer from '@/components/home/FeaturedVehiclesServer';
import HeroSection from '@/components/home/HeroSection';
import ServicesOverview from '@/components/home/ServicesOverview';
import Testimonials from '@/components/home/Testimonials';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StructuredData from '@/components/seo/StructuredData';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSkeletons from '@/components/ui/LoadingSkeletons';
import { client } from '@/lib/sanity';
import { generatePageSchemas } from '@/lib/seo-schema';

// Fully Static Generation - Pre-render at build time for maximum performance
// Since content updates monthly, no need for ISR revalidation
// Redeploy after adding new vehicles in Sanity to update the homepage
export const dynamic = 'force-static';
export const revalidate = false; // Fully static (no revalidation)

// Server Component - fetches data on the server
async function getFeaturedVehicles() {
  try {
    const query = `*[_type == "vehicle" && featured == true] | order(_createdAt desc) [0...6] {
      _id,
      _type,
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
      "mainImage": mainImage.asset->url,
      _createdAt,
      _updatedAt
    }`;

    const vehicles = await client.fetch(query, {}, {
      next: {
        revalidate: 60, // ISR: Revalidate every 60 seconds
        tags: ['vehicles', 'featured'],
      }
    });

    return vehicles || [];
  } catch (error) {
    console.error('Error fetching featured vehicles:', error);
    return [];
  }
}

// Get total vehicle count for dynamic display
async function getVehicleCount() {
  try {
    const query = `count(*[_type == "vehicle"])`;
    const count = await client.fetch(query, {}, {
      next: {
        revalidate: 60, // ISR: Revalidate every 60 seconds
        tags: ['vehicles'],
      }
    });
    return count || 0;
  } catch (error) {
    console.error('Error fetching vehicle count:', error);
    return 0;
  }
}

export default async function HomePage() {
  // Fetch data on the server
  const vehiclesPromise = getFeaturedVehicles();
  const vehicleCount = await getVehicleCount();

  // Generate homepage schema
  const schemas = generatePageSchemas('homepage');

  return (
    <>
      <StructuredData schemas={schemas} />
      <div>
        <ErrorBoundary level="section">
          <HeroSection vehicleCount={vehicleCount} />
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <Suspense fallback={<LoadingSkeletons type="featured-vehicles" />}>
            <FeaturedVehiclesServer vehiclesPromise={vehiclesPromise} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <Suspense fallback={<LoadingSkeletons type="services" />}>
            <ServicesOverview />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <Suspense fallback={<LoadingSkeletons type="generic" />}>
            <WhyChooseUs />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <Suspense fallback={<LoadingSkeletons type="testimonials" />}>
            <Testimonials />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}