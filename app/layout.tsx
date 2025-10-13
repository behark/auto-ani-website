import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";

import "./globals.css";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FinancingCalculator from "@/components/ui/FinancingCalculator";
import FloatingContactWidget from "@/components/ui/FloatingContactWidget";
import TradeInEstimator from "@/components/ui/TradeInEstimator";
import { LanguageProvider } from "@/contexts/LanguageContext";
import WebVitals, { PerformanceMonitor } from "@/components/performance/WebVitals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "AUTO ANI | Auto Salon Premium - 9+ Vite Përsosmërie | Mitrovicë, Kosovë",
  description: "Auto salon premium në Mitrovicë, Kosovë. Mbi 2500 vetura të shitura që nga 2015. Makina të reja dhe të përdorura, financim 0%, bonus shkëmbimi €1000. BMW, Mercedes, Audi, VW, Toyota.",
  keywords: "auto salon, autosallonani, vetura, makina, Mitrovica, Kosovo, AUTO ANI, BMW, Mercedes, Audi, Volkswagen, Toyota, financim, auto salloni, kerkoj veture",
  openGraph: {
    title: "AUTO ANI | Auto Salon Premium Që Nga 2015",
    description: "Mbi 2500 klientë të kënaqur. Vetura premium me financim 0% në dispozicion. Na vizitoni në Mitrovicë, Kosovë.",
    type: "website",
    locale: "sq_XK",
    alternateLocale: ["sr_RS", "en_US"],
    siteName: "AUTO ANI",
    url: "https://autosalonani.com",
    images: [
      {
        url: "https://autosalonani.com/images/showroom.jpg",
        width: 1200,
        height: 630,
        alt: "AUTO ANI Premium Showroom",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTO ANI | Premium Auto Salon Since 2015',
    description: 'Over 2500 satisfied customers. Premium vehicles with 0% financing available. Visit us in Kosovo.',
    images: ['https://autosalonani.com/images/showroom.jpg'],
  },
  manifest: '/manifest.json',
  applicationName: 'AUTO ANI',
  category: 'automotive',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#000000' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} antialiased transition-colors duration-300`}>
        <LanguageProvider>
          <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
            <ErrorBoundary level="component">
              <header id="navigation" role="banner">
                <Navbar />
              </header>
            </ErrorBoundary>
            <main id="main-content" className="min-h-screen pt-20" role="main" tabIndex={-1}>
              <ErrorBoundary level="section">
                {children}
              </ErrorBoundary>
            </main>
            <ErrorBoundary level="component">
              <footer id="footer" role="contentinfo">
                <Footer />
              </footer>
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <FloatingContactWidget />
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <FinancingCalculator />
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <TradeInEstimator />
            </ErrorBoundary>
          </ErrorBoundary>
        </LanguageProvider>

        {/* Performance monitoring */}
        <WebVitals debug={process.env.NODE_ENV === 'development'} />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
