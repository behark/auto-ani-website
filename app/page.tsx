import { Suspense } from 'react';
import HeroSection from '@/components/home/HeroSection';
import ServicesOverview from '@/components/home/ServicesOverview';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import StructuredData from '@/components/seo/StructuredData';
import { generatePageSchemas } from '@/lib/seo-schema';
import { client } from '@/lib/sanity';
import FeaturedVehiclesServer from '@/components/home/FeaturedVehiclesServer';
import LoadingSkeletons from '@/components/ui/LoadingSkeletons';

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