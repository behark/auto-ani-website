import EnhancedServicesPage from '@/components/EnhancedServicesPage';

// Enable ISR with 24-hour revalidation for services page
// Services information rarely changes, daily revalidation is sufficient
export const revalidate = 86400; // 24 hours

export default function ServicesPage() {
  return <EnhancedServicesPage />;
}