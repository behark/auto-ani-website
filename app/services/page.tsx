import EnhancedServicesPage from '@/components/EnhancedServicesPage';

// Enable static generation with ISR
export const revalidate = 3600; // Revalidate every hour

export default function ServicesPage() {
  return <EnhancedServicesPage />;
}