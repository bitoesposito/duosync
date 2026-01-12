import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import StoreProvider from "@/store/provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const ibmPlexSans = IBM_Plex_Sans({
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700"],
	style: ["normal", "italic"],
	display: "swap",
	variable: "--font-ibm-plex-sans",
})

export const metadata: Metadata = {
	title: {
		default: "DuoSync",
		template: "%s | DuoSync",
	},
	description: "Synchronize your calendar with friends",
	keywords: ["calendar", "synchronization", "appointments", "productivity"],
	authors: [{ name: "Vito Esposito" }],
	creator: "Vito Esposito",
	publisher: "Vito Esposito",
	applicationName: "DuoSync",
	manifest: "/manifest.json",
	icons: {
		icon: [
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
		locale: "en_US",
		url: "/",
		siteName: "DuoSync",
		title: "DuoSync - Synchronize your calendar with friends",
		description: "Synchronize your calendar with friends",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "DuoSync",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "DuoSync - Synchronize your calendar with friends",
		description: "Synchronize your calendar with friends",
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
}

export const viewport = {
	themeColor: "#000000",
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={ibmPlexSans.variable} suppressHydrationWarning>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
					storageKey={undefined}
				>
					<StoreProvider>
						{children}
						<Toaster />
					</StoreProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
