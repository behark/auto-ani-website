import ContactPageClient from '@/components/contact/ContactPageClient';

// Enable ISR with 24-hour revalidation for the Contact page
// Contact information rarely changes, so daily revalidation is sufficient
export const revalidate = 86400; // 24 hours

export default function ContactPage() {
  return <ContactPageClient />;
}