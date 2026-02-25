import type { Metadata } from "next";
import localFont from "next/font/local";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { SessionProvider } from "@/lib/hooks/use-session";
import QueryClientWrapper from "@/lib/query-client";
import "../../../globals.css";
import { cookies } from "next/headers";
import { Header } from "@/components/dashboard/sidebar/header";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { getSession } from "@/lib/auth/utils";

export const metadata: Metadata = {
	title: "Fixr - Dashboard",
	description: "O jeito fácil de gerenciar sua assistência técnica.",
};

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
}: Readonly<{ children: React.ReactNode }>) {
	const cookieStore = await cookies();
	const session = getSession(cookieStore);

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${cal.variable} font-(family-name:--font-inter) antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					disableTransitionOnChange
					enableSystem
				>
					<QueryClientWrapper>
						<SessionProvider>
							<Sidebar session={session} />
							<Header />
							<main className="w-full px-6 py-6 pt-20 transition-all lg:ml-[calc(286px+0.625rem)] lg:w-[calc(100%-(286px+0.625rem))] lg:px-10 lg:py-8">
								{children}
							</main>
						</SessionProvider>
						<ThemedToaster />
					</QueryClientWrapper>
				</ThemeProvider>
			</body>
		</html>
	);
}
