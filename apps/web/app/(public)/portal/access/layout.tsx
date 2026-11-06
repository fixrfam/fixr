"use client";

import { useTranslation } from "@fixr/i18n/react";
import { AuthSplit } from "@/components/auth/auth-split";

/** The customer's sign-in: the employee login, mirrored, with its own photo. */
export default function PortalAccessLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { t } = useTranslation();

	return (
		<AuthSplit
			credit={{
				label: t("portal.access.layout.photoCredit"),
				href: "https://unsplash.com/pt-br/fotografias/homem-reparando-smartphone-android-K7OUs6y_cm8",
			}}
			cta={t("portal.access.layout.cta")}
			headline={[
				t("portal.access.layout.headline.first"),
				t("portal.access.layout.headline.second"),
				t("portal.access.layout.headline.third"),
				t("portal.access.layout.headline.fourth"),
			]}
			image={{
				src: "/portal_login_bg.webp",
				alt: t("portal.access.layout.imageAlt"),
				width: 1410,
				height: 2506,
			}}
			imageSide="right"
		>
			{children}
		</AuthSplit>
	);
}
