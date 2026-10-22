"use client";

import { env } from "@fixr/env/web";
import { useTranslation } from "@fixr/i18n/react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { TextLogo } from "@/components/svg/text-logo";
import { Button } from "@/components/ui/button";
import { useScrollPosition } from "@/lib/hooks/use-scroll-position";
import { cn } from "@/lib/utils";

export default function Header() {
	const { t } = useTranslation();
	const { hasScrolled } = useScrollPosition();

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
					<nav className="hidden lg:block">
						<ul className="flex gap-6 font-light">
							<li>{t("home.nav.features")}</li>
							<li>{t("home.nav.products")}</li>
							<li>{t("home.nav.pricing")}</li>
							<li>{t("home.nav.customers")}</li>
							<li>{t("home.nav.contact")}</li>
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
					<Link href="/auth/login" prefetch>
						<Button size="sm">{t("common.auth.login")}</Button>
					</Link>
					<LanguageToggle size={"sm"} />
					<ModeToggle size={"sm"} />
				</div>
			</div>
		</header>
	);
}
