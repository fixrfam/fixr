import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import QueryClientWrapper from "@/lib/query-client";

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
		title: `${t("portal.nav.home")} · ${t("common.app.name")}`,
		robots: { index: false, follow: false },
	};
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

/**
 * The client portal and the estimate links: an app of their own, without the
 * site's header and footer, opened from the links sent by email.
 */
export default async function PortalRootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${inter.variable} ${cal.variable} font-(family-name:--font-inter) antialiased`}
			>
				<I18nProvider locale={locale}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
						<QueryClientWrapper>{children}</QueryClientWrapper>
						<ThemedToaster />
					</ThemeProvider>
				</I18nProvider>
			</body>
		</html>
	);
}
