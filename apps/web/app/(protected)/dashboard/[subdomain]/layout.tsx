import type { Metadata } from "next";
import localFont from "next/font/local";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { SessionProvider } from "@/lib/hooks/use-session";
import QueryClientWrapper from "@/lib/query-client";
import "../../../globals.css";
import { cookies } from "next/headers";
import { Header } from "@/components/dashboard/sidebar/header";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { getSession } from "@/lib/auth/utils";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	const { t } = await getTranslator();

	return {
		title: t("dashboard.metadata.title"),
		description: t("common.app.tagline"),
	};
}

const inter = localFont({
	src: "../../../fonts/InterVF.ttf",
	variable: "--font-inter",
	weight: "100 200 300 400 500 600 700 800 900",
});

const cal = localFont({
	src: "../../../fonts/CalSans.woff",
	variable: "--font-cal",
	weight: "100 200 300 400 500 600 700 800 900",
});

export default async function RootLayout({
	children,
	modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
	const cookieStore = await cookies();
	const session = getSession(cookieStore);
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
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
						<QueryClientWrapper>
							<SessionProvider session={session}>
								<Sidebar session={session} />
								<Header />
								<div className="lg:py-2">
									<main
										className={cn(
											"h-[calc(100dvh-1rem)] overflow-auto bg-card px-5 py-6 pt-20 transition-all",
											"lg:ml-[286px] lg:w-[calc(100%-(286px+0.5rem))] lg:rounded-md lg:border lg:border-border lg:px-10 lg:py-8"
										)}
									>
										{children}
									</main>
								</div>
								{modal}
							</SessionProvider>
							<ThemedToaster />
						</QueryClientWrapper>
					</ThemeProvider>
				</I18nProvider>
			</body>
		</html>
	);
}
