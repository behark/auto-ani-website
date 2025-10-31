import type { Metadata } from 'next';

import EnhancedServicesPage from '@/components/EnhancedServicesPage';

export const metadata: Metadata = {
  title: "Shërbimet Tona | AUTO ANI - Financim, Trade-In, Garanci dhe Më Shumë",
  description: "Zbuloni shërbimet tona: Financim me kushte të favorshme (0% interes), Trade-in me vlerësim falas, garanci deri 24 muaj, test drive falas. Shërbim profesional për çdo klient.",
  openGraph: {
    title: "Shërbimet Tona | AUTO ANI",
    description: "Financim, Trade-in, Garanci, Test Drive - Shërbime të plota për blerjen e veturës së ëndrrave.",
    type: "website",
    url: "https://autosalonani.com/services",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shërbimet Tona | AUTO ANI",
    description: "Financim, Trade-in, Garanci, Test Drive - Shërbime të plota për blerjen e veturës së ëndrrave.",
  },
  alternates: {
    canonical: "https://autosalonani.com/services",
  },
};

export default function ServicesPage() {
  return <EnhancedServicesPage />;
}