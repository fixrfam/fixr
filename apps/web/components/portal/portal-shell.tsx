"use client";

import { useTranslation } from "@fixr/i18n/react";
import { FileText, Home, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { Avatar } from "@/components/account/profile-avatar";
import { Logo } from "@/components/svg/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallpaper } from "@/components/wallpaper";
import { cn } from "@/lib/utils";
import {
	firstName,
	usePortalEstimates,
	usePortalMe,
	useRedirectWithoutSession,
} from "./store";

const ICON_NAV = [
	{ href: "/portal", key: "home", Icon: Home },
	{ href: "/portal/service-orders", key: "serviceOrders", Icon: Wrench },
	{ href: "/portal/estimates", key: "estimates", Icon: FileText },
] as const;

const PROFILE = "/portal/profile";

function isActive(pathname: string, href: string) {
	return href === "/portal" ? pathname === href : pathname.startsWith(href);
}

/**
 * The bottom navigation: icons only, the profile as the customer's photo, and
 * one highlight that slides to the active item.
 */
function PortalNav({ email, pending }: { email?: string; pending: number }) {
	const { t } = useTranslation();
	const pathname = usePathname();
	const listRef = useRef<HTMLUListElement>(null);
	const pillRef = useRef<HTMLSpanElement>(null);
	const mounted = useRef(false);

	const place = useCallback((animate: boolean) => {
		const list = listRef.current;
		const pill = pillRef.current;
		const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!(list && pill)) {
			return;
		}
		if (!active) {
			pill.style.opacity = "0";
			return;
		}
		if (!animate) {
			pill.style.transition = "none";
		}
		pill.style.opacity = "1";
		pill.style.transform = `translateX(${active.offsetLeft}px)`;
		pill.style.width = `${active.offsetWidth}px`;
		if (!animate) {
			// Reading layout commits the jump before the transition comes back.
			pill.getBoundingClientRect();
			pill.style.transition = "";
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: measures again on each route change
	useLayoutEffect(() => {
		place(mounted.current);
		mounted.current = true;
	}, [pathname, place]);

	useLayoutEffect(() => {
		const onResize = () => place(false);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [place]);

	const item =
		"relative z-1 grid size-12 place-items-center rounded-full transition-[color,scale] duration-150 ease-out active:scale-[0.96]";

	return (
		<nav
			aria-label={t("portal.nav.label")}
			className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
		>
			<ul
				className="relative flex items-center gap-1 rounded-full bg-background/90 p-1.5 shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_8px_24px_-6px_oklch(0_0_0/0.25)] backdrop-blur-xl dark:shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_8px_24px_-6px_oklch(0_0_0/0.6)]"
				ref={listRef}
			>
				<span
					aria-hidden
					className="absolute top-1.5 left-0 h-12 rounded-full bg-primary opacity-0 transition-[transform,width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
					ref={pillRef}
				/>
				{ICON_NAV.map(({ href, key, Icon }) => {
					const active = isActive(pathname, href);
					return (
						<li key={href}>
							<Link
								aria-current={active ? "page" : undefined}
								aria-label={t(`portal.nav.${key}`)}
								className={cn(
									item,
									active
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
								href={href}
							>
								<Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
								{key === "estimates" && pending > 0 && (
									<span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-amber-500 font-semibold text-[0.625rem] text-white tabular-nums ring-2 ring-background">
										{pending}
									</span>
								)}
							</Link>
						</li>
					);
				})}
				<li>
					<Link
						aria-current={isActive(pathname, PROFILE) ? "page" : undefined}
						aria-label={t("portal.nav.profile")}
						className={item}
						href={PROFILE}
					>
						<Avatar
							className={cn(
								"size-9 transition-[box-shadow] duration-150",
								isActive(pathname, PROFILE) &&
									"shadow-[0_0_0_2px_var(--color-primary-foreground)]"
							)}
							fallbackHash={email ?? "portal"}
							fallbackType="beam"
						/>
					</Link>
				</li>
			</ul>
		</nav>
	);
}

/**
 * The customer portal app: a header on the wallpaper with the greeting and the
 * customer's photo, the page, and a floating bottom navigation. Phones first.
 * Without a session it sends the customer to ask for a link.
 */
export function PortalShell({ children }: { children: ReactNode }) {
	const { t } = useTranslation();
	const me = usePortalMe();
	const estimates = usePortalEstimates();
	const unauthorized = useRedirectWithoutSession(me.error);
	const pending = (estimates.data ?? []).filter(
		(estimate) => estimate.status === "sent" && !estimate.expired
	).length;
	const name = firstName(me.data?.name);
	// The greeting leads the home; the other pages keep the header short.
	const home = usePathname() === "/portal";

	return (
		<div className="min-h-dvh bg-background">
			<Wallpaper>
				<header
					className={cn(
						"mx-auto flex max-w-3xl gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-white",
						home ? "items-start pb-16" : "items-center pb-12"
					)}
				>
					<div
						className={cn("min-w-0 flex-1", !home && "flex items-center gap-3")}
					>
						<Logo className={cn("size-7 shrink-0", home && "mb-6")} />
						{me.isPending ? (
							<Skeleton className="h-7 w-36 bg-white/15" />
						) : (
							<p
								className={cn(
									"truncate font-heading font-semibold",
									home ? "text-3xl" : "text-lg"
								)}
							>
								{name
									? t("portal.header.greeting", { name })
									: t("portal.header.greetingNoName")}
							</p>
						)}
						{home && (
							<p className="mt-1 text-pretty text-sm text-white/75">
								{t("portal.home.subtitle")}
							</p>
						)}
					</div>
					<Link
						aria-label={t("portal.header.openProfile")}
						className="rounded-full transition-[scale] duration-150 ease-out active:scale-[0.96]"
						href={PROFILE}
					>
						<Avatar
							className="size-10 shadow-[0_0_0_2px_oklch(1_0_0/0.35)]"
							fallbackHash={me.data?.email ?? "portal"}
							fallbackType="beam"
						/>
					</Link>
				</header>
			</Wallpaper>

			{/* The page rises over the wallpaper like a sheet. */}
			<main className="relative -mt-8 rounded-t-[2rem] bg-background">
				<div className="mx-auto max-w-3xl px-4 pt-6 pb-32">
					{unauthorized ? null : children}
				</div>
			</main>

			<PortalNav email={me.data?.email} pending={pending} />
		</div>
	);
}

/** Page title inside the portal. */
export function PortalPageTitle({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<div className="mb-5">
			<h1 className="text-balance font-heading font-semibold text-2xl">
				{title}
			</h1>
			{description && (
				<p className="text-pretty text-muted-foreground text-sm">
					{description}
				</p>
			)}
		</div>
	);
}
