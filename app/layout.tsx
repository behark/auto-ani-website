import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import dynamic from "next/dynamic";

import "./globals.css";

import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import WebVitals, { PerformanceMonitor } from "@/components/performance/WebVitals";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LazyFloatingContactWidget from "@/components/ui/LazyFloatingContactWidget";
import WhatsAppChatWidget from "@/components/whatsapp/WhatsAppChatWidget";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Development-only performance panel
const PerformancePanel = dynamic(
  () => import("@/components/dev/PerformancePanel"),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Add font-display: swap for faster FCP
  preload: true,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap", // Add font-display: swap for faster FCP
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://autosalonani.com'),
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
        url: "https://autosalonani.com/images/showroom.webp",
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
    images: ['https://autosalonani.com/images/showroom.webp'],
  },
  manifest: '/manifest.json',
  applicationName: 'AUTO ANI',
  category: 'automotive',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        {/* Resource hints for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} antialiased transition-colors duration-300`}>
        <LanguageProvider>
          <ComparisonProvider>
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
              <LazyFloatingContactWidget />
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <WhatsAppChatWidget />
            </ErrorBoundary>
          </ErrorBoundary>
          </ComparisonProvider>
        </LanguageProvider>

        {/* Toast Notifications */}
        <Toaster position="top-right" richColors />

        {/* Analytics & Performance monitoring */}
        <Analytics />
        <SpeedInsights />
        <WebVitals debug={process.env.NODE_ENV === 'development'} />
        <PerformanceMonitor />

        {/* Vercel Toolbar - Shows feature flags, comments, and more */}
        {process.env.NODE_ENV === 'development' && <VercelToolbar />}

        {/* Development-only performance panel (Ctrl+Shift+P to toggle) */}
        {process.env.NODE_ENV === 'development' && <PerformancePanel />}
      </body>
    </html>
  );
}
