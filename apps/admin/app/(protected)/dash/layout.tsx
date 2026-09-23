import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { I18nProvider } from "@/components/i18n-provider";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getLocale, getTranslator } from "@/lib/i18n/server";

const geistSans = localFont({
	src: "../../fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const inter = localFont({
	src: "../../fonts/InterVF.ttf",
	variable: "--font-inter",
	weight: "100 200 300 400 500 600 700 800 900",
});
const geistMono = localFont({
	src: "../../fonts/GeistMonoVF.woff",
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
}: Readonly<{ children: React.ReactNode }>) {
	const [locale, { t }] = await Promise.all([getLocale(), getTranslator()]);

	return (
		<ClerkProvider>
			<html lang={locale} suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} font-(family-name:--font-geist-sans) antialiased`}
				>
					<I18nProvider locale={locale}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							disableTransitionOnChange
							enableSystem
						>
							<SidebarProvider>
								<AppSidebar />
								<SidebarInset>
									<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
										<div className="flex items-center gap-2 px-4">
											<SidebarTrigger className="-ml-1" />
											<Separator className="mr-2 h-4" orientation="vertical" />
											<Breadcrumb>
												<BreadcrumbList>
													<BreadcrumbItem className="hidden md:block">
														<BreadcrumbLink href="#">
															{t("admin.breadcrumb.root")}
														</BreadcrumbLink>
													</BreadcrumbItem>
													<BreadcrumbSeparator className="hidden md:block" />
													<BreadcrumbItem>
														<BreadcrumbPage>
															{t("admin.breadcrumb.current")}
														</BreadcrumbPage>
													</BreadcrumbItem>
												</BreadcrumbList>
											</Breadcrumb>
										</div>
									</header>
									<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
										{children}
									</div>
								</SidebarInset>
							</SidebarProvider>
							<ThemedToaster />
						</ThemeProvider>
					</I18nProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
