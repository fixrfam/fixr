import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { SessionProvider } from "@/lib/hooks/use-session";
import QueryClientWrapper from "@/lib/QueryClient";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../../globals.css";
import { ThemedToaster } from "@/components/themed-toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/utils";
import { Header } from "@/components/dashboard/sidebar/header";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const cookieStore = await cookies();
    const session = getSession(cookieStore);

    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.variable} ${cal.variable} antialiased font-(family-name:--font-inter)`}
            >
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryClientWrapper>
                        <SessionProvider>
                            <Sidebar session={session} />
                            <Header />
                            <main className='pt-20 lg:ml-[calc(286px+0.625rem)] w-full lg:w-[calc(100%-(286px+0.625rem))] py-6 lg:py-8 px-6 lg:px-10 transition-all'>
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
