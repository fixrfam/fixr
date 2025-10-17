import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { SessionProvider } from "@/lib/hooks/use-session";
import { ApiDowntimeBanner } from "@/components/home/ApiDowntimeBanner";
import Footer from "@/components/home/layout/Footer";
import Header from "@/components/home/layout/Header";

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
    openGraph: {
        type: "website",
        url: "https://fixr.com.br",
        title: "O jeito fácil de gerenciar sua assistência técnica",
        description:
            "Simplifique processos, reduza erros e ofereça um atendimento mais ágil e profissional na sua assistência técnica.",
        siteName: "Fixr",
        images: [{ url: "https://fixr.com.br/og_image.jpg" }],
    },
    twitter: {
        card: "summary_large_image",
        images: "https://fixr.com.br/twitter_image.jpg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.variable} ${cal.variable} antialiased font-(family-name:--font-inter)`}
            >
                <SessionProvider>
                    <ThemeProvider
                        attribute='class'
                        defaultTheme='system'
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className='items-center justify-items-center min-h-screen gap-16'>
                            <ApiDowntimeBanner />
                            <Header />
                            {children}
                            <Footer className='z-2' />
                        </div>
                        <ThemedToaster />
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
