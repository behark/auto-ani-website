import EnhancedAboutPage from '@/components/EnhancedAboutPage';

// Fully Static Generation - Pre-render at build time for maximum performance
// Company information updates monthly, no need for ISR revalidation
// Redeploy after updating company info in CMS
export const dynamic = 'force-static';
export const revalidate = false; // Fully static (no revalidation)

export default function AboutPage() {
  return <EnhancedAboutPage />;
}