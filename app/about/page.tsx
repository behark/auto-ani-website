import EnhancedAboutPage from '@/components/EnhancedAboutPage';

// Enable ISR with 24-hour revalidation for the About page
// Company information rarely changes, so daily revalidation is sufficient
export const revalidate = 86400; // 24 hours

export default function AboutPage() {
  return <EnhancedAboutPage />;
}