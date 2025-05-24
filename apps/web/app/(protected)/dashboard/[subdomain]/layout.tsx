import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { SessionProvider } from "@/lib/hooks/use-session";
import QueryClientWrapper from "@/lib/QueryClient";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../../globals.css";
import { ThemedToaster } from "@/components/themed-toaster";
import { ThemeProvider } from "@/components/theme-provider";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const sidebarStyle = { width: "286px", margin: "0.625rem" };

    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.variable} ${cal.variable} antialiased font-[family-name:var(--font-inter)]`}
            >
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryClientWrapper>
                        <SessionProvider>
                            <Sidebar width={sidebarStyle.width} margin={sidebarStyle.margin} />
                            <main className='ml-[calc(286px+0.625rem)] w-[calc(100%-(286px+0.625rem))] py-8 px-10'>
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
