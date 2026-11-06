"use client";

import { useTranslation } from "@fixr/i18n/react";
import { AuthSplit } from "@/components/auth/auth-split";

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { t } = useTranslation();

	return (
		<AuthSplit
			credit={{
				label: t("auth.layout.photoCredit"),
				href: "https://unsplash.com/pt-br/fotografias/uma-pessoa-trabalhando-em-um-laptop-com-uma-caneta-XTs2Fl2iXkY",
			}}
			cta={t("auth.layout.cta")}
			headline={[
				t("auth.layout.headline.first"),
				t("auth.layout.headline.second"),
				t("auth.layout.headline.third"),
				t("auth.layout.headline.fourth"),
			]}
			image={{
				src: "/login_bg.webp",
				alt: t("auth.layout.imageAlt"),
				width: 1410,
				height: 1740,
			}}
			imageSide="left"
		>
			{children}
		</AuthSplit>
	);
}
