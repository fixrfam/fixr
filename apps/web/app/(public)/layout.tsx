import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ApiDowntimeBanner } from "@/components/home/api-downtime-banner";
import Footer from "@/components/home/layout/footer";
import Header from "@/components/home/layout/header";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { SessionProvider } from "@/lib/hooks/use-session";
import { getLocale, getTranslator } from "@/lib/i18n/server";

const inter = localFont({
	src: "../fonts/InterVF.ttf",
	variable: "--font-inter",
	weight: "100 200 300 400 500 600 700 800 900",
});

const cal = localFont({
	src: "../fonts/CalSans.woff",
	variable: "--font-cal",
	weight: "100 200 300 400 500 600 700 800 900",
});

export async function generateMetadata(): Promise<Metadata> {
	const { t } = await getTranslator();

	return {
		title: t("common.app.name"),
		description: t("common.app.tagline"),
		openGraph: {
			type: "website",
			url: "https://fixr.com.br",
			title: t("common.app.tagline"),
			description: t("common.app.description"),
			siteName: t("common.app.name"),
			images: [{ url: "https://fixr.com.br/og_image.jpg" }],
		},
		twitter: {
			card: "summary_large_image",
			images: "https://fixr.com.br/twitter_image.jpg",
		},
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<script
					defer
					src="https://tracking.ricardo.gg/api/script.js?siteId=5c232fc77649"
				/>
			</head>
			<body
				className={`${inter.variable} ${cal.variable} font-(family-name:--font-inter) antialiased`}
			>
				<I18nProvider locale={locale}>
					<SessionProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							disableTransitionOnChange
							enableSystem
						>
							<div className="min-h-screen items-center justify-items-center gap-16">
								<ApiDowntimeBanner />
								<Header />
								{children}
								<Footer className="z-2" />
							</div>
							<ThemedToaster />
						</ThemeProvider>
					</SessionProvider>
				</I18nProvider>
			</body>
		</html>
	);
}
