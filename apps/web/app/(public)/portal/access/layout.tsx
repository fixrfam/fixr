"use client";

import { useTranslation } from "@fixr/i18n/react";
import { AuthSplit } from "@/components/auth/auth-split";

/** The customer's sign-in: the employee login, mirrored, on the portal's wallpaper. */
export default function PortalAccessLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { t } = useTranslation();

	return (
		<AuthSplit
			cta={t("portal.access.layout.cta")}
			headline={[
				t("portal.access.layout.headline.first"),
				t("portal.access.layout.headline.second"),
				t("portal.access.layout.headline.third"),
				t("portal.access.layout.headline.fourth"),
			]}
			image={{
				src: "/portal-bg.webp",
				alt: "",
				width: 1600,
				height: 900,
			}}
			imageSide="right"
		>
			{children}
		</AuthSplit>
	);
}
