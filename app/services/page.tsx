import EnhancedServicesPage from '@/components/EnhancedServicesPage';

// Fully Static Generation - Pre-render at build time for maximum performance
// Services information updates monthly, no need for ISR revalidation
// Redeploy after updating services in CMS
export const dynamic = 'force-static';
export const revalidate = false; // Fully static (no revalidation)

export default function ServicesPage() {
  return <EnhancedServicesPage />;
}