import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shërbimet | AUTO ANI - Finansim, Garanci, Mirëmbajtje dhe Më Shumë',
  description: 'Zbuloni shërbimet tona të plota: finansim 0%, garanci e zgjeruar, mirëmbajtje profesionale, test drive, vlerësim veture, siguracion dhe shërbim post-shitje. Gjithçka që ju nevojitet për veturën tuaj.',
  keywords: 'shërbime AUTO ANI, finansim vetura, garanci e zgjeruar, mirëmbajtje makina, test drive, vlerësim veture, siguracion auto, shërbim post-shitje, rezervë pjesë',
  openGraph: {
    title: 'Shërbimet e AUTO ANI | Financim, Garanci dhe Mirëmbajtje Profesionale',
    description: 'Shërbime të gjera për çdo nevojë të klientëve tanë. Nga financimi tek mirëmbajtja, jemi këtu për ju.',
    type: 'website',
    url: 'https://autosalonani.com/services',
    images: [
      {
        url: 'https://autosalonani.com/images/services.jpg',
        width: 1200,
        height: 630,
        alt: 'Shërbimet e AUTO ANI - Financim dhe mirëmbajtje profesionale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shërbimet e AUTO ANI | Financim dhe Mirëmbajtje',
    description: 'Shërbime të plota për veturën tuaj. Financim 0%, garanci dhe mirëmbajtje profesionale.',
  },
  alternates: {
    canonical: 'https://autosalonani.com/services',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}