"use client";

import { Logo } from "@/components/svg/Logo";
import { FloatingToggle } from "./floating-toggle";
import { useParams, usePathname } from "next/navigation";
import { getDashboardRouteName } from "@/lib/utils/getDashboardRouteName";
import { DashLink } from "../dash-link";

export function Header() {
    const pathname = usePathname();
    const params = useParams<{ subdomain: string }>();

    return (
        <header className='lg:hidden absolute w-full h-16 z-[97] flex items-center justify-between bg-background/90 backdrop-blur-sm px-4 border-border/30 border-b'>
            <DashLink href='/home' subdomain={params.subdomain}>
                <Logo className='size-8' />
            </DashLink>
            <p className='text-sm'>{getDashboardRouteName(pathname)}</p>
            <FloatingToggle className='relative z-[101]' />
        </header>
    );
}
