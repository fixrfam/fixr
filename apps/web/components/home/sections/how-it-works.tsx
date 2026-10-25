"use client";

import { useTranslation } from "@fixr/i18n/react";
import { BellRing, ClipboardPen, FileCheck2, Route } from "lucide-react";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const STEPS = [
	{ key: "intake", icon: ClipboardPen },
	{ key: "estimate", icon: FileCheck2 },
	{ key: "deliver", icon: BellRing },
] as const;

export default function HowItWorks() {
	const { t } = useTranslation();

	return (
		<section
			className="flex w-full max-w-7xl scroll-mt-24 flex-col gap-12"
			id="how-it-works"
		>
			<SectionHeading
				badge={t("home.howItWorks.badge")}
				description={t("home.howItWorks.description")}
				icon={Route}
				titleBefore={t("home.howItWorks.titleBefore")}
				titleHighlight={t("home.howItWorks.titleHighlight")}
			/>
			<div className="relative">
				<div
					aria-hidden="true"
					className="absolute top-10 right-[16%] left-[16%] hidden h-px border-border border-t border-dashed md:block"
				/>
				<ol className="grid gap-4 md:grid-cols-3">
					{STEPS.map(({ key, icon: Icon }, index) => (
						<li className="relative" key={key}>
							<Reveal
								className="flex h-full flex-col items-center gap-4 p-4 text-center"
								delay={index * 0.12}
							>
								<div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-primary">
									<Icon className="size-6" />
								</div>
								<span className="font-light text-muted-foreground text-xs uppercase tracking-wider">
									{t("home.howItWorks.step", { number: index + 1 })}
								</span>
								<h3 className="font-heading text-xl">
									{t(`home.howItWorks.steps.${key}.title`)}
								</h3>
								<p className="max-w-xs text-pretty font-light text-muted-foreground text-sm md:text-base">
									{t(`home.howItWorks.steps.${key}.description`)}
								</p>
							</Reveal>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
