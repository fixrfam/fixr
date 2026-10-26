"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	Feather,
	History,
	KeyRound,
	type LucideIcon,
	Mail,
} from "lucide-react";
import type { ComponentType } from "react";
import { LampContainer } from "@/components/ui/lamp";
import { cn } from "@/lib/utils";
import { CatalogScene } from "../iso/scenes/catalog";
import { EstimateScene } from "../iso/scenes/estimate";
import { InventoryScene } from "../iso/scenes/inventory";
import { PortalScene } from "../iso/scenes/portal";
import { ServiceOrdersScene } from "../iso/scenes/service-orders";
import { Reveal } from "../reveal";

type CardKey =
	| "serviceOrders"
	| "estimates"
	| "portal"
	| "inventory"
	| "catalog";

const CARDS: {
	key: CardKey;
	scene: ComponentType<{ label: string }>;
	wide?: boolean;
}[] = [
	{ key: "serviceOrders", scene: ServiceOrdersScene, wide: true },
	{ key: "estimates", scene: EstimateScene },
	{ key: "portal", scene: PortalScene },
	{ key: "inventory", scene: InventoryScene },
	{ key: "catalog", scene: CatalogScene },
];

const EXTRAS: { key: "notifications" | "history" | "api"; icon: LucideIcon }[] =
	[
		{ key: "notifications", icon: Mail },
		{ key: "history", icon: History },
		{ key: "api", icon: KeyRound },
	];

export default function Features({ className }: { className?: string }) {
	const { t } = useTranslation();

	return (
		<section
			className={cn(
				"relative flex w-full max-w-7xl scroll-mt-24 flex-col items-center gap-12",
				className
			)}
			id="features"
		>
			<LampContainer className="absolute z-[-1]! hidden -translate-y-[42.5%] lg:flex" />

			<div className="flex min-h-96 flex-col items-center justify-center gap-4">
				<div className="rounded-full border border-primary bg-background px-3 py-2 font-light text-primary text-xs md:px-4 md:py-2 md:text-sm">
					<Feather className="mr-2 inline-block h-4 w-4" />
					{t("home.features.badge")}
				</div>
				<div className="space-y-4">
					<h2 className="text-center font-light text-3xl md:text-5xl lg:text-6xl">
						{t("home.features.titleBefore")}{" "}
						<span className="font-heading">{t("home.features.titleWork")}</span>
						{t("home.features.titleBetween")}{" "}
						<span className="font-heading">
							{t("home.features.titleEasier")}
						</span>
					</h2>
					<p className="text-pretty text-center font-light text-base md:text-lg lg:text-2xl">
						{t("home.features.description")}
					</p>
				</div>
			</div>

			<div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
				{CARDS.map(({ key, scene: Scene, wide }, index) => (
					<Reveal
						className={cn(wide && "md:col-span-2")}
						delay={(index % 3) * 0.08}
						key={key}
					>
						<article className="group flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-primary/40">
							<div
								className={cn(
									"flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-muted/60 p-6",
									wide && "md:aspect-16/10"
								)}
							>
								<Scene label={t(`home.features.cards.${key}.scene`)} />
							</div>
							<div className="flex flex-col gap-2 px-4 pb-4">
								<h3 className="font-heading text-xl">
									{t(`home.features.cards.${key}.title`)}
								</h3>
								<p className="max-w-lg text-pretty font-light text-muted-foreground text-sm md:text-base">
									{t(`home.features.cards.${key}.description`)}
								</p>
							</div>
						</article>
					</Reveal>
				))}
			</div>

			<ul className="grid w-full gap-4 md:grid-cols-3">
				{EXTRAS.map(({ key, icon: Icon }, index) => (
					<li key={key}>
						<Reveal
							className="flex h-full gap-4 rounded-2xl border border-border p-4"
							delay={index * 0.08}
						>
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
								<Icon className="size-5" />
							</div>
							<div className="flex flex-col gap-1">
								<h3 className="font-medium text-base">
									{t(`home.features.extras.${key}.title`)}
								</h3>
								<p className="text-pretty font-light text-muted-foreground text-sm">
									{t(`home.features.extras.${key}.description`)}
								</p>
							</div>
						</Reveal>
					</li>
				))}
			</ul>
		</section>
	);
}
