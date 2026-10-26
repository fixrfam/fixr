"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	CircleCheck,
	FileQuestion,
	PackageX,
	PhoneCall,
	ScrollText,
	Unplug,
} from "lucide-react";
import { PaperToRecordScene } from "../iso/scenes/paper-to-record";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const PAINS = [
	{ key: "lost", icon: ScrollText },
	{ key: "estimates", icon: FileQuestion },
	{ key: "stock", icon: PackageX },
	{ key: "calls", icon: PhoneCall },
] as const;

export default function Problem() {
	const { t } = useTranslation();

	return (
		<section
			className="relative z-3 grid w-full max-w-7xl scroll-mt-24 items-center gap-12 lg:grid-cols-2"
			id="why"
		>
			<div className="flex flex-col gap-8">
				<SectionHeading
					align="left"
					badge={t("home.problem.badge")}
					description={t("home.problem.description")}
					icon={Unplug}
					titleBefore={t("home.problem.titleBefore")}
					titleHighlight={t("home.problem.titleHighlight")}
				/>
				<ul className="grid gap-3 sm:grid-cols-2">
					{PAINS.map(({ key, icon: Icon }, index) => (
						<li key={key}>
							<Reveal
								className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4"
								delay={index * 0.08}
							>
								<Icon className="size-5 text-muted-foreground" />
								<h3 className="font-medium text-base">
									{t(`home.problem.pains.${key}.title`)}
								</h3>
								<p className="text-pretty font-light text-muted-foreground text-sm">
									{t(`home.problem.pains.${key}.description`)}
								</p>
							</Reveal>
						</li>
					))}
				</ul>
				<Reveal className="flex items-center gap-2 font-light text-base">
					<CircleCheck className="size-5 shrink-0 text-primary" />
					{t("home.problem.solution")}
				</Reveal>
			</div>
			<Reveal className="aspect-4/3 w-full" delay={0.15}>
				<PaperToRecordScene label={t("home.problem.scene")} />
			</Reveal>
		</section>
	);
}
