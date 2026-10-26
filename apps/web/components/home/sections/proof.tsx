"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	ArrowUpRight,
	Code2,
	Handshake,
	LockKeyhole,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const GITHUB_URL = "https://github.com/fixrfam/fixr";

const POINTS = [
	{ key: "interviews", icon: Handshake },
	{ key: "isolation", icon: LockKeyhole },
	{ key: "openSource", icon: Code2 },
] as const;

export default function Proof() {
	const { t } = useTranslation();

	return (
		<section
			className="flex w-full max-w-7xl scroll-mt-24 flex-col items-center gap-12"
			id="proof"
		>
			<SectionHeading
				badge={t("home.proof.badge")}
				description={t("home.proof.description")}
				icon={Wrench}
				titleBefore={t("home.proof.titleBefore")}
				titleHighlight={t("home.proof.titleHighlight")}
			/>
			<ul className="grid w-full gap-4 md:grid-cols-3">
				{POINTS.map(({ key, icon: Icon }, index) => (
					<li key={key}>
						<Reveal
							className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-6"
							delay={index * 0.08}
						>
							<Icon className="size-6 text-primary" />
							<h3 className="font-heading text-xl">
								{t(`home.proof.points.${key}.title`)}
							</h3>
							<p className="text-pretty font-light text-base text-muted-foreground">
								{t(`home.proof.points.${key}.description`)}
							</p>
						</Reveal>
					</li>
				))}
			</ul>
			<Reveal>
				<Link
					className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-primary text-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
					href={GITHUB_URL}
					rel="noopener noreferrer"
					target="_blank"
				>
					{t("home.proof.github")}
					<ArrowUpRight className="size-4" />
				</Link>
			</Reveal>
		</section>
	);
}
