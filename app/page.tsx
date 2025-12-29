import { Suspense } from 'react';

import FeaturedVehiclesServer from '@/components/home/FeaturedVehiclesServer';
import FinancingFleetCTA from '@/components/home/FinancingFleetCTA';
import HeroSection from '@/components/home/HeroSection';
import ServicesOverview from '@/components/home/ServicesOverview';
import Testimonials from '@/components/home/Testimonials';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StructuredData from '@/components/seo/StructuredData';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSkeletons from '@/components/ui/LoadingSkeletons';
import { vehicleHelpers } from '@/data/vehicles';
import { generatePageSchemas } from '@/lib/seo-schema';

// No revalidation needed with hardcoded data - static generation
// Remove ISR since we're using static data

// Server Component - fetches data from hardcoded source
async function getFeaturedVehicles() {
  try {
    // Get featured vehicles from hardcoded data
    const vehicles = vehicleHelpers.getFeatured(6);
    return vehicles || [];
  } catch (error) {
    console.error('Error fetching featured vehicles:', error);
    return [];
  }
}

// Get total vehicle count for dynamic display
async function getVehicleCount() {
  try {
    // Get count from hardcoded data
    const stats = vehicleHelpers.getStats();
    return stats.available || 0;
  } catch (error) {
    console.error('Error fetching vehicle count:', error);
    return 0;
  }
}

export default async function HomePage() {
  // Fetch data on the server - await all data for static generation
  const vehicles = await getFeaturedVehicles();
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
          <FeaturedVehiclesServer vehicles={vehicles} />
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <FinancingFleetCTA />
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