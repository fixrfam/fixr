import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { ClerkProvider } from "@clerk/nextjs";

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

export const metadata: Metadata = {
    title: "Fixr Admin",
    description: "Painel de administrador",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang='en' suppressHydrationWarning>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased font-[family-name:var(--font-inter)]`}
                >
                    <ThemeProvider
                        attribute='class'
                        defaultTheme='system'
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                        <ThemedToaster />
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
