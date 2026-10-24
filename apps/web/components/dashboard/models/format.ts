import { type ModelMeta, modelMetaSchema } from "@fixr/schemas/models";
import {
	Laptop,
	type LucideIcon,
	Monitor,
	Smartphone,
	Tablet,
	Watch,
} from "lucide-react";

/** Category slugs of the shared catalog, in the order the filters show them. */
export const CATALOG_CATEGORIES = [
	"smartphone",
	"tablet",
	"smartwatch",
	"notebook",
	"monitor",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<CatalogCategory, LucideIcon> = {
	smartphone: Smartphone,
	tablet: Tablet,
	smartwatch: Watch,
	notebook: Laptop,
	monitor: Monitor,
};

export function isCatalogCategory(slug: string): slug is CatalogCategory {
	return (CATALOG_CATEGORIES as readonly string[]).includes(slug);
}

export function categoryIcon(slug: string | null | undefined): LucideIcon {
	return slug && isCatalogCategory(slug) ? CATEGORY_ICONS[slug] : Smartphone;
}

const PARTIAL_DATE_REGEX = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/;
const YEAR_REGEX = /\b(19|20)\d{2}\b/;
const MAH_REGEX = /(\d[\d.,]*)\s*mAh/i;

/**
 * Catalog dates are as precise as their source: "2024", "2024-03" or
 * "2024-03-11". Anything else (custom models) is shown as typed.
 */
export function formatPartialDate(
	value: string | null | undefined,
	locale: string
): string | null {
	if (!value) {
		return null;
	}
	const match = PARTIAL_DATE_REGEX.exec(value);
	if (!match) {
		return value;
	}
	const [, year, month, day] = match;
	if (!month) {
		return year!;
	}
	const date = new Date(
		Date.UTC(Number(year), Number(month) - 1, Number(day ?? 1))
	);
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: day ? "short" : "long",
		day: day ? "numeric" : undefined,
		timeZone: "UTC",
	}).format(date);
}

export function releaseYear(model: {
	released: string | null;
	announced: string | null;
}): string | null {
	return (
		YEAR_REGEX.exec(model.released ?? "")?.[0] ??
		YEAR_REGEX.exec(model.announced ?? "")?.[0] ??
		null
	);
}

/** "Li-Ion 5000 mAh, non-removable" → "5000 mAh". */
export function batteryCapacity(battery: string | null): string | null {
	const match = MAH_REGEX.exec(battery ?? "");
	return match ? `${match[1]} mAh` : null;
}

export interface Swatch {
	name: string | null;
	hex: string;
}

/** Color names and their hex codes, paired by position. */
export function swatches(
	colors: string | null | undefined,
	colorsHex: string | null | undefined
): Swatch[] {
	const hexes = (colorsHex ?? "")
		.split(",")
		.map((hex) => hex.trim())
		.filter(Boolean);
	const names = (colors ?? "").split(",").map((name) => name.trim());
	return hexes.map((hex, index) => ({ name: names[index] || null, hex }));
}

/** First entry of a list-like spec: "256GB 8GB RAM, 512GB 8GB RAM" → "256GB 8GB RAM". */
export function firstOption(value: string | null): string | null {
	return value?.split(",")[0]?.trim() || null;
}

/** The extra specs stored as JSON; unreadable or unknown content is ignored. */
export function parseMeta(meta: string | null | undefined): ModelMeta {
	if (!meta) {
		return {};
	}
	try {
		const parsed = modelMetaSchema.safeParse(JSON.parse(meta));
		return parsed.success ? parsed.data : {};
	} catch {
		return {};
	}
}

/** Drops trailing zeros: 6.10 → "6.1". */
export function formatNumber(value: number, locale: string) {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
		value
	);
}
