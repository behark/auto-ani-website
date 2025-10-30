import ContactPageClient from '@/components/contact/ContactPageClient';

// Fully Static Generation - Pre-render at build time for maximum performance
// Contact information updates monthly, no need for ISR revalidation
// Redeploy after updating contact info in CMS
export const dynamic = 'force-static';
export const revalidate = false; // Fully static (no revalidation)

export default function ContactPage() {
  return <ContactPageClient />;
}