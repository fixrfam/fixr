"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ModelDetail } from "@fixr/schemas/models";
import {
	ArrowLeft,
	Battery,
	ChevronRight,
	Cpu,
	ExternalLink,
	HardDrive,
	type LucideIcon,
	MonitorSmartphone,
	SearchX,
	Weight,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	batteryCapacity,
	categoryIcon,
	firstOption,
	formatNumber,
	formatPartialDate,
	isCatalogCategory,
	parseMeta,
	swatches,
} from "./format";
import { ModelImage } from "./model-image";
import { buildSpecSections, type SpecSection } from "./spec-sections";
import { useModel } from "./store";

const KNOWN_STATUSES = ["Available", "Discontinued", "Cancelled", "Rumored"];

const STATUS_STYLES: Record<string, string> = {
	Available:
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	Rumored: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
	Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

function Gallery({ model }: { model: ModelDetail }) {
	const { t } = useTranslation();
	const images = model.images
		.filter((image) => image.presignedUrl)
		.sort(
			(a, b) =>
				Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position
		);
	const [selected, setSelected] = useState(0);
	const current = images[selected] ?? images[0];

	return (
		<div className="space-y-2">
			<div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-gradient-to-b from-muted/30 to-muted">
				<AnimatePresence initial={false} mode="popLayout">
					<motion.div
						animate={{ opacity: 1, scale: 1 }}
						className="absolute inset-0"
						exit={{ opacity: 0, scale: 0.98 }}
						initial={{ opacity: 0, scale: 1.02 }}
						key={current?.id ?? "empty"}
						transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					>
						<ModelImage
							alt={t("models.details.imageAlt", { name: model.name })}
							category={model.category?.slug}
							className="size-full rounded-none bg-none"
							iconClassName="size-1/3"
							loading="eager"
							src={current?.presignedUrl ?? model.imageUrl}
						/>
					</motion.div>
				</AnimatePresence>
				{!(current || model.imageUrl) && (
					<p className="absolute inset-x-0 bottom-4 text-center text-muted-foreground text-xs">
						{t("models.details.noPhoto")}
					</p>
				)}
			</div>
			{images.length > 1 && (
				<div className="flex gap-2 overflow-x-auto">
					{images.map((image, index) => (
						<button
							aria-label={t("models.details.photo", { index: index + 1 })}
							aria-pressed={index === selected}
							className={cn(
								"size-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
								index === selected
									? "border-primary"
									: "border-transparent hover:border-border"
							)}
							key={image.id}
							onClick={() => setSelected(index)}
							type="button"
						>
							<ModelImage
								alt=""
								category={model.category?.slug}
								className="size-full rounded-none"
								src={image.presignedUrl}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function Highlight({
	icon: Icon,
	label,
	value,
	detail,
	index,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	detail?: string | null;
	index: number;
}) {
	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="min-w-0 rounded-lg border bg-background p-3"
			initial={{ opacity: 0, y: 8 }}
			transition={{ delay: 0.05 * index, duration: 0.3, ease: "easeOut" }}
		>
			<div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
				<Icon className="size-3.5" />
				{label}
			</div>
			<p className="truncate font-semibold" title={value}>
				{value}
			</p>
			{detail && (
				<p className="truncate text-muted-foreground text-xs" title={detail}>
					{detail}
				</p>
			)}
		</motion.div>
	);
}

function Highlights({ model }: { model: ModelDetail }) {
	const { t, locale } = useTranslation();
	const display = model.displaySizeInches
		? `${formatNumber(model.displaySizeInches, locale)}"`
		: model.displaySize;
	const memory = firstOption(model.internalMemory);
	const battery = batteryCapacity(model.battery);
	const weight =
		model.weightGrams != null
			? `${formatNumber(model.weightGrams, locale)} g`
			: null;

	const tiles = [
		display && {
			icon: MonitorSmartphone,
			label: t("models.details.highlights.display"),
			value: display,
			detail: model.displayResolution?.split(",")[0],
		},
		(model.chipset || model.cpu) && {
			icon: Cpu,
			label: t("models.details.highlights.chip"),
			value: (model.chipset ?? model.cpu)!,
			detail: model.chipset ? model.cpu : model.gpu,
		},
		memory && {
			icon: HardDrive,
			label: t("models.details.highlights.memory"),
			value: memory,
		},
		battery
			? {
					icon: Battery,
					label: t("models.details.highlights.battery"),
					value: battery,
					detail: model.batteryCharging,
				}
			: weight && {
					icon: Weight,
					label: t("models.details.highlights.weight"),
					value: weight,
				},
	].filter(Boolean) as {
		icon: LucideIcon;
		label: string;
		value: string;
		detail?: string | null;
	}[];

	if (tiles.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
			{tiles.map((tile, index) => (
				<Highlight index={index} key={tile.label} {...tile} />
			))}
		</div>
	);
}

function SpecCard({ section, index }: { section: SpecSection; index: number }) {
	const { t } = useTranslation();
	const Icon = section.icon;

	return (
		<motion.section
			animate={{ opacity: 1, y: 0 }}
			className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-background"
			initial={{ opacity: 0, y: 12 }}
			transition={{ delay: 0.03 * index, duration: 0.3, ease: "easeOut" }}
		>
			<h2 className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 font-semibold text-sm">
				<Icon className="size-4 text-muted-foreground" />
				{t(`models.details.sections.${section.key}`)}
			</h2>
			<dl className="divide-y px-4">
				{section.rows.map((row) => (
					<div
						className="grid grid-cols-[minmax(7rem,2fr)_3fr] gap-3 py-2.5 text-sm"
						key={row.field}
					>
						<dt className="text-muted-foreground">
							{t(`models.details.fields.${row.field}`)}
						</dt>
						<dd className="break-words">{row.value}</dd>
					</div>
				))}
			</dl>
		</motion.section>
	);
}

function DetailsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-5 w-64" />
			<div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
				<Skeleton className="aspect-square w-full rounded-xl" />
				<div className="space-y-3">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-9 w-3/4" />
					<Skeleton className="h-5 w-32" />
					<div className="grid grid-cols-2 gap-2 pt-4 lg:grid-cols-4">
						{[0, 1, 2, 3].map((tile) => (
							<Skeleton className="h-20" key={tile} />
						))}
					</div>
				</div>
			</div>
			<div className="gap-4 md:columns-2">
				{[0, 1, 2, 3].map((card) => (
					<Skeleton className="mb-4 h-48" key={card} />
				))}
			</div>
		</div>
	);
}

export function ModelDetails({ slug }: { slug: string }) {
	const { t, locale } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const query = useModel(slug);
	const listHref = `/dashboard/${subdomain}/devices/models`;

	if (query.isPending) {
		return <DetailsSkeleton />;
	}

	if (query.isError || !query.data) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-center">
				<div className="grid size-12 place-items-center rounded-full bg-muted">
					<SearchX className="size-6 text-muted-foreground" />
				</div>
				<p className="font-medium">{t("models.details.notFound")}</p>
				<Button asChild size="sm" variant="outline">
					<Link href={listHref}>
						<ArrowLeft />
						{t("models.details.back")}
					</Link>
				</Button>
			</div>
		);
	}

	const model = query.data;
	const meta = parseMeta(model.meta);
	const category = model.category;
	const CategoryIcon = categoryIcon(category?.slug);
	const categoryLabel =
		category && isCatalogCategory(category.slug)
			? t(`models.categories.${category.slug}`)
			: category?.name;
	const statusLabel = (status: string) =>
		KNOWN_STATUSES.includes(status)
			? t(`models.status.${status as "Available"}`)
			: status;
	const sections = buildSpecSections(model, meta, { locale, statusLabel });
	const colors = swatches(model.colors, model.colorsHex);
	const released = formatPartialDate(model.released, locale);
	const announced = formatPartialDate(model.announced, locale);
	const isCustom = model.companyId !== null;
	const filterHref = (params: Record<string, string>) =>
		`${listHref}?${new URLSearchParams(params).toString()}`;

	return (
		<div className="space-y-6">
			<nav
				aria-label={t("models.details.breadcrumb")}
				className="flex flex-wrap items-center gap-1 text-muted-foreground text-sm"
			>
				<Link className="hover:text-foreground" href={listHref}>
					{t("dashboard.nav.models")}
				</Link>
				{category && (
					<>
						<ChevronRight className="size-3.5" />
						<Link
							className="hover:text-foreground"
							href={filterHref({ category: category.slug })}
						>
							{categoryLabel}
						</Link>
					</>
				)}
				<ChevronRight className="size-3.5" />
				<Link
					className="hover:text-foreground"
					href={filterHref({
						maker: model.maker.id,
						...(category ? { category: category.slug } : {}),
					})}
				>
					{model.maker.name}
				</Link>
				<ChevronRight className="size-3.5" />
				<span aria-current="page" className="truncate text-foreground">
					{model.name}
				</span>
			</nav>

			<div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr] lg:grid-cols-[minmax(0,20rem)_1fr]">
				<Gallery model={model} />

				<div className="min-w-0 space-y-4">
					<div className="space-y-1">
						{categoryLabel && (
							<p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
								<CategoryIcon className="size-3.5" />
								{categoryLabel}
							</p>
						)}
						<h1 className="text-balance font-heading font-semibold text-2xl lg:text-3xl">
							{model.name}
						</h1>
						<p className="text-muted-foreground">{model.maker.name}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{model.status && (
							<Badge
								className={cn("font-normal", STATUS_STYLES[model.status])}
								variant="outline"
							>
								{statusLabel(model.status)}
							</Badge>
						)}
						{(released || announced) && (
							<Badge className="font-normal" variant="outline">
								{released
									? t("models.details.released", { date: released })
									: t("models.details.announced", { date: announced! })}
							</Badge>
						)}
						{isCustom && (
							<Badge className="font-normal" variant="secondary">
								{t("models.explorer.customHint")}
							</Badge>
						)}
					</div>

					{colors.length > 0 && (
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground text-sm">
								{t("models.details.colors")}
							</span>
							<div className="flex flex-wrap items-center gap-1.5">
								{colors.map((swatch, index) => (
									<Tooltip key={`${swatch.hex}-${index}`}>
										<TooltipTrigger asChild>
											<motion.span
												animate={{ scale: 1 }}
												className="block size-6 rounded-full border border-foreground/15 shadow-sm"
												initial={{ scale: 0 }}
												style={{ backgroundColor: swatch.hex }}
												tabIndex={0}
												transition={{
													delay: 0.04 * index,
													type: "spring",
													bounce: 0.4,
												}}
												whileHover={{ scale: 1.15 }}
											/>
										</TooltipTrigger>
										{swatch.name && (
											<TooltipContent>{swatch.name}</TooltipContent>
										)}
									</Tooltip>
								))}
							</div>
						</div>
					)}

					<Highlights model={model} />

					{!isCustom && model.url.startsWith("http") && (
						<a
							className="inline-flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
							href={model.url}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="size-3.5" />
							{t("models.details.source")}
						</a>
					)}
				</div>
			</div>

			<div className="gap-4 md:columns-2">
				{sections.map((section, index) => (
					<SpecCard index={index} key={section.key} section={section} />
				))}
			</div>
		</div>
	);
}
