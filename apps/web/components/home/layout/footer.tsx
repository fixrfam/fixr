"use client";

import { useTranslation } from "@fixr/i18n/react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { TextLogo } from "@/components/svg/text-logo";
import { cn } from "@/lib/utils";

export default function Footer({
	className,
	...props
}: ComponentPropsWithoutRef<"footer">) {
	const { t } = useTranslation();

	return (
		<footer
			className={cn(
				"z-2 mx-auto flex flex-col items-center justify-center gap-2 py-16",
				className
			)}
			{...props}
		>
			<p className="px-4 text-center text-muted-foreground/50 text-sm">
				{t("home.footer.builtByBefore")}{" "}
				<TextLogo className="inline-flex w-11 align-sub" />{" "}
				{t("home.footer.builtByAfter")}{" "}
				<Link
					className="underline"
					href="https://vemprafam.com.br/"
					rel="noopener noreferrer"
					target="_blank"
				>
					FAM
				</Link>
				. © {new Date().getFullYear()} Fixr. {t("home.footer.codeAvailable")}{" "}
				<Link
					className="underline"
					href="https://github.com/fixrfam/fixr"
					rel="noopener noreferrer"
					target="_blank"
				>
					GitHub
				</Link>
				.
			</p>
			<div className="flex items-center gap-4 text-muted-foreground text-sm">
				<Link className="hover:underline" href="/legal/privacy-policy">
					{t("home.footer.privacy")}
				</Link>
				<Link className="hover:underline" href="/legal/terms-and-conditions">
					{t("home.footer.terms")}
				</Link>
			</div>
		</footer>
	);
}
