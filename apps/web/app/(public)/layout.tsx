import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import Header from "@/components/home/Header";
import { SessionProvider } from "@/lib/hooks/use-session";

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

export const metadata: Metadata = {
    title: "Fixr",
    description: "O jeito fácil de gerenciar sua assistência técnica.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.variable} ${cal.variable} antialiased font-[family-name:var(--font-inter)]`}
            >
                <SessionProvider>
                    <ThemeProvider
                        attribute='class'
                        defaultTheme='system'
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className='items-center justify-items-center min-h-screen gap-16'>
                            <Header />
                            {children}
                        </div>
                        <ThemedToaster />
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
