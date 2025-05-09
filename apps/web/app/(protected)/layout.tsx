import { Navbar } from "@/components/dashboard/navbar";
import QueryClientWrapper from "@/lib/QueryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Fixr - Dashboard",
    description: "O jeito fácil de gerenciar sua assistência técnica.",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <QueryClientWrapper>
            <Navbar />
            <main className='mt-4 max-w-6xl pb-20 sm:mx-auto lg:mt-10 lg:pb-10 max-sm:px-4 px-8'>
                {children}
            </main>
        </QueryClientWrapper>
    );
}
