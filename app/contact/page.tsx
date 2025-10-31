import type { Metadata } from 'next';

import ContactPageClient from '@/components/contact/ContactPageClient';

export const metadata: Metadata = {
  title: "Kontakti | AUTO ANI - Na Kontaktoni për Vetura Premium",
  description: "Kontaktoni AUTO ANI për konsulencë falas, test drive ose pyetje për vetura. Tel: +383 49 204 242. Vizitoni sallonin tonë në Mitrovicë, Kosovë. Hapjes: E Hënë - E Shtunë, 09:00 - 18:00.",
  openGraph: {
    title: "Kontakti | AUTO ANI",
    description: "Kontaktoni AUTO ANI për konsulencë falas, test drive ose pyetje për vetura. Jemi në shërbimin tuaj çdo ditë pune.",
    type: "website",
    url: "https://autosalonani.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kontakti | AUTO ANI",
    description: "Kontaktoni AUTO ANI për konsulencë falas, test drive ose pyetje për vetura.",
  },
  alternates: {
    canonical: "https://autosalonani.com/contact",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}