"use client";

import { useTranslation } from "@fixr/i18n/react";
import Image from "next/image";
import Link from "next/link";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Logo } from "@/components/svg/logo";

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { t } = useTranslation();

	return (
		<div className="grid min-h-svh w-full p-6 pt-24 lg:grid-cols-2">
			<div className="relative hidden overflow-clip rounded-3xl bg-muted lg:block">
				<Image
					alt={t("auth.layout.imageAlt")}
					className="absolute inset-0 h-full w-full object-cover"
					height={1740}
					src={"/login_bg.webp"}
					width={1410}
				/>
				<div className="absolute z-10 flex size-full flex-col justify-between px-16 py-12 xl:px-20 xl:py-16">
					<BlurFade direction="up">
						<Logo className="w-14 shrink-0 text-white" />
					</BlurFade>
					<h1 className="text-[3.875rem] text-white leading-18 tracking-tight xl:text-[4.5rem] xl:leading-21">
						<TextAnimate
							animation="blurInUp"
							as="span"
							by="character"
							delay={0.15}
						>
							{t("auth.layout.headline.first")}
						</TextAnimate>
						<br />{" "}
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 2}
						>
							{t("auth.layout.headline.second")}
						</TextAnimate>{" "}
						<TextAnimate
							animation="blurInUp"
							as="span"
							by="character"
							delay={0.15 * 3}
						>
							{t("auth.layout.headline.third")}
						</TextAnimate>
						<br />
						{""}
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 4}
						>
							{t("auth.layout.headline.fourth")}
						</TextAnimate>
					</h1>
					<BlurFade delay={0.3} direction="up">
						<div>
							<p className="text-white text-xl">{t("auth.layout.cta")}</p>
							<Link
								href="https://unsplash.com/pt-br/fotografias/uma-pessoa-trabalhando-em-um-laptop-com-uma-caneta-XTs2Fl2iXkY"
								rel="noopener noreferrer"
								target="_blank"
							>
								<p className="text-white/50 hover:underline">
									{t("auth.layout.photoCredit")}
								</p>
							</Link>
						</div>
					</BlurFade>
				</div>
			</div>
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex flex-1 items-center justify-center">
					<BlurFade>
						<div className="w-full max-w-xs">{children}</div>
					</BlurFade>
				</div>
			</div>
		</div>
	);
}
