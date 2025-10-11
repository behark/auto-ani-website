'use client';

import dynamic from 'next/dynamic';
import HeroSection from '@/components/home/HeroSection';
import SuspenseWrapper from '@/components/ui/SuspenseWrapper';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LazySection from '@/components/ui/LazySection';

const FeaturedVehicles = dynamic(() => import('@/components/home/FeaturedVehicles'), {
  ssr: true,
});
const ServicesOverview = dynamic(() => import('@/components/home/ServicesOverview'), {
  ssr: true,
});
const WhyChooseUs = dynamic(() => import('@/components/home/WhyChooseUs'), {
  ssr: true,
});
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  ssr: true,
});

export default function HomePage() {
  return (
    <div>
      <ErrorBoundary level="section">
        <HeroSection />
      </ErrorBoundary>

      <ErrorBoundary level="section">
        <SuspenseWrapper skeletonType="featured-vehicles">
          <FeaturedVehicles />
        </SuspenseWrapper>
      </ErrorBoundary>

      <ErrorBoundary level="section">
        <SuspenseWrapper skeletonType="services">
          <ServicesOverview />
        </SuspenseWrapper>
      </ErrorBoundary>

      <ErrorBoundary level="section">
        <SuspenseWrapper skeletonType="generic">
          <WhyChooseUs />
        </SuspenseWrapper>
      </ErrorBoundary>

      <ErrorBoundary level="section">
        <LazySection
          loadingType="skeleton"
          minHeight="400px"
          rootMargin="300px"
          delay={100}
        >
          <SuspenseWrapper skeletonType="testimonials">
            <Testimonials />
          </SuspenseWrapper>
        </LazySection>
      </ErrorBoundary>
    </div>
  );
}