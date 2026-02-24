"use client";

import { useParams, usePathname } from "next/navigation";
import { Logo } from "@/components/svg/Logo";
import { getDashboardRouteName } from "@/lib/utils/get-dashboard-route-name";
import { DashLink } from "../dash-link";
import { FloatingToggle } from "./floating-toggle";

export function Header() {
	const pathname = usePathname();
	const params = useParams<{ subdomain: string }>();

	return (
		<header className="absolute z-97 flex h-16 w-full items-center justify-between border-border/30 border-b bg-background/90 px-4 backdrop-blur-xs lg:hidden">
			<DashLink href="/home" subdomain={params.subdomain}>
				<Logo className="size-8" />
			</DashLink>
			<p className="text-sm">{getDashboardRouteName(pathname)}</p>
			<FloatingToggle className="relative z-101" />
		</header>
	);
}
