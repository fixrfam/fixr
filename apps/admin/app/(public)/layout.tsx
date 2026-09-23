import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { getLocale, getTranslator } from "@/lib/i18n/server";

const geistSans = localFont({
	src: "../fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const inter = localFont({
	src: "../fonts/InterVF.ttf",
	variable: "--font-inter",
	weight: "100 200 300 400 500 600 700 800 900",
});
const geistMono = localFont({
	src: "../fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
	const { t } = await getTranslator();

	return {
		title: t("admin.metadata.title"),
		description: t("admin.metadata.description"),
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();

	return (
		<ClerkProvider>
			<html lang={locale} suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} font-(family-name:--font-inter) antialiased`}
				>
					<I18nProvider locale={locale}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							disableTransitionOnChange
							enableSystem
						>
							{children}
							<ThemedToaster />
						</ThemeProvider>
					</I18nProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
