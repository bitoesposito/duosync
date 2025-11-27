import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n";
import ServiceWorkerRegistrar from "@/components/layout/service-worker-registrar";
import PWAOnboarding from "@/components/layout/pwa-onboarding";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DuoSync",
  description: "Sincronizza i tuoi impegni con il tuo partner",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DuoSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
              Visita il blog
            </Link>
          </span>
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <ServiceWorkerRegistrar />
            <PWAOnboarding />
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
