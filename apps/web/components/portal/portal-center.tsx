"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ReactNode } from "react";
import { FixrLoader } from "@/components/fixr-loader";
import { Logo } from "@/components/svg/logo";
import { PortalCover } from "./portal-shell";

/**
 * The pages before signing in: the wallpaper as a band on phones and as the
 * left half on larger screens, the content on the plain background.
 */
export function PortalCenter({
	aside,
	children,
}: {
	/** Shown on the wallpaper next to the logo (e.g. what the portal offers). */
	aside?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex min-h-dvh flex-col bg-background lg:grid lg:grid-cols-2">
			<PortalCover className="flex h-40 shrink-0 flex-col justify-between p-6 text-white lg:h-auto lg:min-h-dvh lg:p-12">
				<Logo className="size-9" />
				{aside && <div className="mt-8 hidden lg:block">{aside}</div>}
			</PortalCover>
			<div className="flex items-start justify-center px-5 py-8 lg:items-center lg:px-12">
				<div className="w-full max-w-sm">{children}</div>
			</div>
		</div>
	);
}

/** Full screen loader on the wallpaper, while a link signs the browser in. */
export function PortalOpening() {
	const { t } = useTranslation();

	return (
		<PortalCover className="grid min-h-dvh place-items-center">
			<div className="flex flex-col items-center gap-4 text-white">
				<FixrLoader className="size-14 text-white" />
				<p className="text-sm text-white/80">{t("portal.entry.opening")}</p>
			</div>
		</PortalCover>
	);
}
