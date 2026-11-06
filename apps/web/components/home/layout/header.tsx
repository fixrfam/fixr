"use client";

import { env } from "@fixr/env/web";
import { useTranslation } from "@fixr/i18n/react";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/account/profile-avatar";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { TextLogo } from "@/components/svg/text-logo";
import { Button } from "@/components/ui/button";
import { dashboardHref } from "@/lib/auth/utils";
import { useScrollPosition } from "@/lib/hooks/use-scroll-position";
import { useSession } from "@/lib/hooks/use-session";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ key: "features", href: "/#features" },
	{ key: "howItWorks", href: "/#how-it-works" },
	{ key: "roles", href: "/#roles" },
	{ key: "faq", href: "/#faq" },
] as const;

/**
 * The site header. Its main button follows who is signed in: the dashboard
 * for an employee, the portal for a customer, the login for nobody.
 */
export default function Header({
	hasPortalSession = false,
}: {
	hasPortalSession?: boolean;
}) {
	const { t } = useTranslation();
	const { hasScrolled } = useScrollPosition();
	const { session } = useSession();
	const name = session?.displayName || session?.email;

	let account = (
		<Link href="/auth/login" prefetch>
			<Button size="sm">{t("common.auth.login")}</Button>
		</Link>
	);
	if (session) {
		account = (
			<Link
				className="flex items-center gap-2"
				href={dashboardHref(session)}
				prefetch
				title={t("common.auth.signedInAs", { name: name ?? "" })}
			>
				<Avatar
					className="size-8!"
					fallbackHash={session.id}
					src={session.avatarUrl}
				/>
				<Button size="sm">
					{t("common.auth.goToDashboard")}
					<ArrowRight className="size-4" />
				</Button>
			</Link>
		);
	} else if (hasPortalSession) {
		account = (
			<Link href="/portal">
				<Button size="sm">
					{t("common.auth.goToPortal")}
					<ArrowRight className="size-4" />
				</Button>
			</Link>
		);
	}

	return (
		<header
			className={
				"fixed z-99 flex h-20 w-full items-center justify-center border-border border-b border-opacity-10 bg-background/50 p-8 backdrop-blur-lg"
			}
		>
			<div
				className={cn(
					"flex w-full items-center justify-between transition-all duration-500",
					hasScrolled ? "max-w-7xl" : "max-w-full"
				)}
			>
				<div className="flex gap-8">
					<Link href="/" prefetch>
						<TextLogo className="w-16 text-primary" />
					</Link>
					<nav aria-label={t("home.nav.label")} className="hidden lg:block">
						<ul className="flex gap-6 font-light">
							{NAV_LINKS.map(({ key, href }) => (
								<li key={key}>
									<Link
										className="rounded-sm transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										href={href}
									>
										{t(`home.nav.${key}`)}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</div>
				<div className="flex gap-2">
					<Link href={env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
						<Button
							className="hidden font-light lg:block"
							size="sm"
							variant="outline"
						>
							{t("home.nav.docs")}{" "}
							<ExternalLink className="inline-block h-3.5 w-3.5" />
						</Button>
					</Link>
					{account}
					<LanguageToggle size={"sm"} />
					<ModeToggle size={"sm"} />
				</div>
			</div>
		</header>
	);
}
