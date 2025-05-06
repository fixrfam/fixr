import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import QueryClientWrapper from "@/lib/QueryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Fixr - Dashboard",
    description: "O jeito fácil de gerenciar sua assistência técnica.",
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const sidebarStyle = { width: "286px", margin: "0.625rem" };

    return (
        <QueryClientWrapper>
            <Sidebar width={sidebarStyle.width} margin={sidebarStyle.margin} />
            <main className='ml-[calc(286px+0.625rem)] w-[calc(100%-(286px+0.625rem))] py-8 px-10'>
                {children}
            </main>
        </QueryClientWrapper>
    );
}
