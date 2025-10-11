import VehiclesPageClient from '@/components/vehicles/VehiclesPageClient';
import type { Vehicle } from '@/lib/types';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Vetura në Shitje | AUTO ANI - Premium Auto Salon Kosovë",
  description: "Zbuloni koleksionin tonë të veturave premium në AUTO ANI. BMW, Mercedes, Audi, VW, Toyota. Finansim 0%, garanci, test drive. Mbi 2500 klientë të kënaqur në Prishtinë, Kosovë.",
  keywords: "vetura shitje, makina Kosovë, AUTO ANI, BMW, Mercedes, Audi, Volkswagen, Toyota, vetura përdorura, auto salon Prishtinë, financim makina, test drive",
  openGraph: {
    title: "Vetura Premium në Shitje | AUTO ANI",
    description: "Koleksion i gjerë veturash premium. Finansim të favorshëm, garanci dhe test drive falas. Vizitoni AUTO ANI në Prishtinë.",
    type: "website",
    url: "https://autosalonani.com/vehicles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vetura Premium në Shitje | AUTO ANI",
    description: "Koleksion i gjerë veturash premium. Finansim të favorshëm, garanci dhe test drive falas.",
  },
  alternates: {
    canonical: "https://autosalonani.com/vehicles",
  },
};

export default function VehiclesPage() {
  // Use client-side loading to bypass server-side issues
  return <VehiclesPageClient initialVehicles={[]} />;
}