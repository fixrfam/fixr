"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ModelListItem } from "@fixr/schemas/models";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
	batteryCapacity,
	firstOption,
	formatNumber,
	releaseYear,
	swatches,
} from "./format";
import { ModelImage } from "./model-image";

const MAX_SWATCHES = 4;
const RESOLUTION_SUFFIX = /\s*pixels.*$/i;
const RESOLUTION_SPLIT = /[,(]/;

const columnHelper = createColumnHelper<ModelListItem>();

function SpecCell({
	primary,
	secondary,
}: {
	primary: string | null;
	secondary?: string | null;
}) {
	return (
		<div className="min-w-0 max-w-56">
			<p className="truncate" title={primary ?? undefined}>
				{primary ?? "-"}
			</p>
			{secondary && (
				<p className="truncate text-muted-foreground text-xs" title={secondary}>
					{secondary}
				</p>
			)}
		</div>
	);
}

function DeviceCell({ model, href }: { model: ModelListItem; href?: string }) {
	const { t } = useTranslation();
	const year = releaseYear(model);
	const content = (
		<>
			<ModelImage
				alt={t("models.details.imageAlt", { name: model.name })}
				category={model.category?.slug}
				className="size-11 transition-transform duration-300 group-hover:scale-105"
				fit="cover"
				src={model.imageUrl}
			/>
			<div className="min-w-0">
				<div className="flex min-w-0 items-center gap-2">
					<span className="truncate font-medium">{model.name}</span>
					{year && (
						<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
							{year}
						</span>
					)}
					{model.isCustom && (
						<Badge
							className="shrink-0 px-1.5 py-0 text-[10px]"
							title={t("models.explorer.customHint")}
							variant="secondary"
						>
							{t("models.explorer.custom")}
						</Badge>
					)}
				</div>
				<p className="truncate text-muted-foreground text-xs">
					{model.maker.name}
				</p>
			</div>
		</>
	);

	// Without a link (picking a model), the row itself is the action.
	if (!href) {
		return <div className="flex min-w-0 items-center gap-3">{content}</div>;
	}
	return (
		<Link
			className="flex min-w-0 items-center gap-3 focus-visible:outline-none"
			href={href}
			onClick={(event) => event.stopPropagation()}
		>
			{content}
		</Link>
	);
}

function ColorsCell({ colorsHex }: { colorsHex: string | null }) {
	const colors = swatches(null, colorsHex);
	if (colors.length === 0) {
		return <span className="text-muted-foreground">-</span>;
	}
	return (
		<div className="flex items-center gap-0.5">
			{colors.slice(0, MAX_SWATCHES).map((swatch, index) => (
				<span
					className="size-3 rounded-full border border-foreground/15"
					key={`${swatch.hex}-${index}`}
					style={{ backgroundColor: swatch.hex }}
				/>
			))}
			{colors.length > MAX_SWATCHES && (
				<span className="ml-0.5 text-[10px] text-muted-foreground tabular-nums">
					+{colors.length - MAX_SWATCHES}
				</span>
			)}
		</div>
	);
}

export function useModelColumns(
	hrefOf?: (model: ModelListItem) => string
): ColumnDef<ModelListItem>[] {
	const { t, locale } = useTranslation();

	return useMemo(() => {
		const device = t("models.explorer.headers.device");
		const display = t("models.explorer.headers.display");
		const platform = t("models.explorer.headers.platform");
		const battery = t("models.explorer.headers.battery");
		const colors = t("models.explorer.headers.colors");

		return [
			columnHelper.accessor("name", {
				header: device,
				cell: ({ row }) => (
					<DeviceCell href={hrefOf?.(row.original)} model={row.original} />
				),
				enableHiding: false,
				meta: { label: device },
			}),
			columnHelper.accessor("displaySizeInches", {
				id: "display",
				header: display,
				cell: ({ row }) => {
					const model = row.original;
					return (
						<SpecCell
							primary={
								model.displaySizeInches
									? `${formatNumber(model.displaySizeInches, locale)}"`
									: model.displaySize
							}
							secondary={
								model.displayResolution
									?.split(RESOLUTION_SPLIT)[0]
									?.replace(RESOLUTION_SUFFIX, "")
									.trim() ?? null
							}
						/>
					);
				},
				meta: { label: display },
			}),
			columnHelper.accessor("chipset", {
				id: "platform",
				header: platform,
				cell: ({ row }) => (
					<SpecCell
						primary={row.original.chipset ?? row.original.cpu}
						secondary={firstOption(row.original.internalMemory)}
					/>
				),
				meta: { label: platform },
			}),
			columnHelper.accessor("battery", {
				header: battery,
				cell: ({ getValue }) => (
					<SpecCell primary={batteryCapacity(getValue())} />
				),
				meta: { label: battery },
			}),
			columnHelper.accessor("colorsHex", {
				id: "colors",
				header: colors,
				cell: ({ getValue }) => <ColorsCell colorsHex={getValue()} />,
				meta: { label: colors },
			}),
		] as ColumnDef<ModelListItem>[];
	}, [t, locale, hrefOf]);
}
