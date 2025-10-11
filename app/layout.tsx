import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
// import "./accessibility.css"; // Temporarily disabled for testing
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import PromotionsBanner from "@/components/ui/PromotionsBanner";
import StructuredData from "@/components/seo/StructuredData";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ThemeProvider, themeScript } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AsyncErrorBoundary from "@/components/ui/AsyncErrorBoundary";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { AccessibilityProvider, AccessibilityToolbar } from "@/components/accessibility/AccessibilityProvider";
import { GDPRProvider } from "@/components/privacy/GDPRProvider";
import CookieConsent from "@/components/privacy/CookieConsent";
import { NavigationProgressProvider } from "@/components/ui/NavigationProgress";
// import AuthProvider from "@/components/providers/AuthProvider";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "AUTO ANI | Premium Auto Salon - 9+ Years of Excellence | Pristina, Kosovo",
  description: "Premium auto salon in Pristina, Kosovo. Over 2500 vehicles sold since 2015. New & used cars, 0% financing, €1000 trade-in bonus. BMW, Mercedes, Audi, VW, Toyota.",
  keywords: "auto salon, autosallonani, vetura, makina, Pristina, Kosovo, Mitrovica, AUTO ANI, BMW, Mercedes, Audi, Volkswagen, Toyota, financim, auto salloni, kerkoj veture",
  openGraph: {
    title: "AUTO ANI | Premium Auto Salon Since 2015",
    description: "Over 2500 satisfied customers. Premium vehicles with 0% financing available. Visit us in Pristina, Kosovo.",
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
      {
        url: "https://autosalonani.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "AUTO ANI Premium Vehicles",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTO ANI | Premium Auto Salon Since 2015',
    description: 'Over 2500 satisfied customers. Premium vehicles with 0% financing available. Visit us in Kosovo.',
    images: ['https://autosalonani.com/images/showroom.jpg'],
  },
  alternates: {
    languages: {
      'sq': '/sq',
      'sr': '/sr',
      'en': '/en',
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AUTO ANI',
    startupImage: [
      {
        url: '/images/pwa/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1290-2796.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1179-2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-828-1792.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1170-2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/images/pwa/apple-splash-1284-2778.png',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      }
    ]
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: 'AUTO ANI',
  category: 'automotive',
  verification: {
    google: "google-verification-code",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} antialiased transition-colors duration-300`}>
        <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
          <AsyncErrorBoundary>
            <ThemeProvider defaultTheme="system" storageKey="auto-ani-theme">
              <NavigationProgressProvider showTopBar={true} showFullPageLoader={false} loadingVariant="minimal" delay={50}>
                <AccessibilityProvider>
                  <GDPRProvider>
                    <LanguageProvider>
                      <FavoritesProvider>
                <StructuredData type="organization" />
                <StructuredData type="website" />
                <ErrorBoundary level="component">
                  <PromotionsBanner />
                </ErrorBoundary>
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
                  <WhatsAppButton />
                </ErrorBoundary>
                <ErrorBoundary level="component">
                  <ServiceWorkerRegister />
                </ErrorBoundary>
                <ErrorBoundary level="component">
                  <PWAInstallPrompt />
                </ErrorBoundary>
                <ErrorBoundary level="component">
                  <OfflineIndicator />
                </ErrorBoundary>
                <ErrorBoundary level="component">
                  <AccessibilityToolbar />
                </ErrorBoundary>
                <ErrorBoundary level="component">
                  <CookieConsent />
                </ErrorBoundary>
                <PerformanceMonitor />
                      </FavoritesProvider>
                    </LanguageProvider>
                  </GDPRProvider>
                </AccessibilityProvider>
              </NavigationProgressProvider>
            </ThemeProvider>
          </AsyncErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}