import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n";
import ServiceWorkerRegistrar from "@/components/layout/service-worker-registrar";
import PWAOnboarding from "@/components/layout/pwa-onboarding";
import { PWAPromptProvider } from "@/features/pwa/pwa-prompt-context";
import {
  detectServerLocale,
  getMetadataTranslations,
  getOpenGraphLocale,
} from "@/lib/i18n/metadata";
import "./globals.css";
import Link from "next/link";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

/**
 * Generates metadata dynamically based on the user's preferred locale.
 * Reads locale from cookies (set by client-side I18nProvider) or Accept-Language header.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectServerLocale();
  const t = getMetadataTranslations(locale);
  const ogLocale = getOpenGraphLocale(locale);

  return {
    title: {
      default: t.title,
      template: "%s | DuoSync",
    },
    description: t.description,
    keywords: t.keywords.split(", "),
    authors: [{ name: "Vito Esposito" }],
    creator: "Vito Esposito",
    publisher: "Vito Esposito",
    applicationName: "DuoSync",
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "https://duosync.vitoesposito.it"
    ),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: "/",
      siteName: "DuoSync",
      title: t.ogTitle,
      description: t.ogDescription,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.ogTitle,
      description: t.ogDescription,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "DuoSync",
    },
    category: "productivity",
  };
}

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect locale server-side for initial HTML lang attribute
  // Client-side I18nProvider will update it if needed
  const initialLocale = await detectServerLocale();

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body
        className={ibmPlexSans.variable}
        suppressHydrationWarning
      >
        {/* 
          Banner to notify users that the app is under construction.
          Only presentational logic: can be refactored later into a reusable component in components/layout if needed.
        */}
        <div
          className="bg-yellow-500 text-black border-b border-yellow-600 p-2 text-center font-medium text-sm leading-none tracking-tight z-50 relative"
          aria-live="polite"
          role="status"
        >
          <span>
            App in sviluppo, per informazioni{" "}
            <Link
              href="https://blog.vitoesposito.it"
              className="text-blue-600 hover:underline hover:text-blue-700"
            >
              visita il blog
            </Link>
          </span>
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey={null}
        >
          <I18nProvider>
            <PWAPromptProvider>
              <ServiceWorkerRegistrar />
              <PWAOnboarding />
              {children}
              <Toaster />
            </PWAPromptProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
