import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import "@/app/globals.css";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { NavigationProgressProvider, NavigationProgressRouteObserver } from "@/components/navigation/navigation-progress";
import { getSiteUrl, siteConfig } from "@/lib/config/site";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <NavigationProgressProvider>
          {children}
          <Suspense fallback={null}>
            <NavigationProgressRouteObserver />
            <AnalyticsTracker />
          </Suspense>
        </NavigationProgressProvider>
      </body>
    </html>
  );
}
