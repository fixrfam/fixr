"use client";

import { useTranslation } from "@fixr/i18n/react";
import { FileText, Home, User, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/account/profile-avatar";
import { Logo } from "@/components/svg/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	firstName,
	usePortalEstimates,
	usePortalMe,
	useRedirectWithoutSession,
} from "./store";

const NAV = [
	{ href: "/portal", key: "home", Icon: Home },
	{ href: "/portal/service-orders", key: "serviceOrders", Icon: Wrench },
	{ href: "/portal/estimates", key: "estimates", Icon: FileText },
	{ href: "/portal/profile", key: "profile", Icon: User },
] as const;

function isActive(pathname: string, href: string) {
	return href === "/portal" ? pathname === href : pathname.startsWith(href);
}

/**
 * The customer portal app: a greeting with the profile on top and a floating
 * bottom navigation, sized for phones first. Without a session it sends the
 * customer to ask for a link.
 */
export function PortalShell({ children }: { children: ReactNode }) {
	const { t } = useTranslation();
	const pathname = usePathname();
	const me = usePortalMe();
	const estimates = usePortalEstimates();
	const unauthorized = useRedirectWithoutSession(me.error);
	const pending = (estimates.data ?? []).filter(
		(estimate) => estimate.status === "sent" && !estimate.expired
	).length;
	const name = firstName(me.data?.name);

	return (
		<div className="relative min-h-dvh bg-muted/30">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent"
			/>
			<header className="relative mx-auto flex max-w-3xl items-center gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
				<Logo className="size-8 shrink-0" />
				<div className="min-w-0 flex-1">
					{me.isPending ? (
						<Skeleton className="h-6 w-36" />
					) : (
						<p className="truncate font-heading font-semibold text-xl">
							{name
								? t("portal.header.greeting", { name })
								: t("portal.header.greetingNoName")}
						</p>
					)}
				</div>
				<Link
					aria-label={t("portal.header.openProfile")}
					className="rounded-full ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					href="/portal/profile"
				>
					<Avatar
						className="size-10 border-2 border-background shadow-sm"
						fallbackHash={me.data?.email ?? "portal"}
						fallbackType="beam"
					/>
				</Link>
			</header>

			<main className="relative mx-auto max-w-3xl px-4 pt-3 pb-32">
				{unauthorized ? null : children}
			</main>

			<nav
				aria-label={t("portal.nav.label")}
				className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 px-4"
			>
				<ul className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full border bg-background/85 p-1.5 shadow-black/10 shadow-xl backdrop-blur-xl">
					{NAV.map(({ href, key, Icon }) => {
						const active = isActive(pathname, href);
						return (
							<li className="flex-1" key={href}>
								<Link
									aria-current={active ? "page" : undefined}
									className={cn(
										"relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-full font-medium text-[0.6875rem] transition-colors",
										active
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									)}
									href={href}
								>
									<Icon className="size-[1.125rem]" />
									{t(`portal.nav.${key}`)}
									{key === "estimates" && pending > 0 && (
										<span className="absolute top-1 right-[calc(50%-1.25rem)] grid min-w-4 place-items-center rounded-full bg-amber-500 px-1 font-semibold text-[0.625rem] text-white tabular-nums">
											{pending}
										</span>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}

/** Page title inside the portal. */
export function PortalPageTitle({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-5 flex items-end justify-between gap-3">
			<div>
				<h1 className="font-heading font-semibold text-2xl">{title}</h1>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{action}
		</div>
	);
}
