/**
 * Turns the rows scraped by `devices.etl` (GSMArena, LaptopMedia and
 * DisplaySpecifications) into the shape of Fixr's shared model catalog.
 *
 * Everything here is pure, so the rules can be tested without a database.
 */

export type SourceName = "gsmarena" | "laptopmedia" | "displayspecs";

/** A model row as the scraper stores it, in any of the three SQLite files. */
export interface ScrapedModel {
	id: number;
	makerName: string;
	makerUrl: string;
	name: string;
	url: string;
	imageLocalPath: string | null;
	category: string | null;
	announced: string | null;
	status: string | null;
	dimensions: string | null;
	weight: string | null;
	build: string | null;
	sim: string | null;
	displayType: string | null;
	displaySize: string | null;
	displayResolution: string | null;
	displayProtection: string | null;
	os: string | null;
	chipset: string | null;
	cpu: string | null;
	gpu: string | null;
	cardSlot: string | null;
	internalMemory: string | null;
	mainCamera: string | null;
	mainCameraFeatures: string | null;
	mainCameraVideo: string | null;
	selfieCamera: string | null;
	selfieFeatures: string | null;
	selfieVideo: string | null;
	battery: string | null;
	batteryCharging: string | null;
	networkTech: string | null;
	sensors: string | null;
	colors: string | null;
	colorsHex: string | null;
	modelsText: string | null;
	price: string | null;
	dimensionsWidth: number | null;
	dimensionsHeight: number | null;
	dimensionsThickness: number | null;
	weightGrams: number | null;
	displaySizeInches: number | null;
	displaySizeRatio: string | null;
	displayResWidth: number | null;
	displayResHeight: number | null;
	displayResPpi: number | null;
	released: string | null;
	meta: string | null;
	/** DisplaySpecifications only. */
	panelType?: string | null;
	backlight?: string | null;
	brightness?: number | null;
	staticContrast?: string | null;
	dynamicContrast?: string | null;
	refreshRate?: string | null;
	colorGamut?: string | null;
	viewingAngles?: string | null;
}

/** Category slugs of the shared catalog. */
export const CATALOG_CATEGORIES = {
	smartphone: "Smartphone",
	tablet: "Tablet",
	smartwatch: "Smartwatch",
	notebook: "Notebook",
	monitor: "Monitor",
} as const;

export type CatalogCategory = keyof typeof CATALOG_CATEGORIES;

const SCRAPED_CATEGORIES: Record<string, CatalogCategory> = {
	phone: "smartphone",
	tablet: "tablet",
	watch: "smartwatch",
	laptop: "notebook",
	monitor: "monitor",
};

/**
 * Brand spellings across the sources, mapped to one name. LaptopMedia names
 * also start with series or typos ("Surface", "Mirrosoft") instead of the brand.
 */
const MAKER_ALIASES: Record<string, string> = {
	asus: "Asus",
	gigabyte: "Gigabyte",
	aorus: "Aorus",
	mirrosoft: "Microsoft",
	surface: "Microsoft",
	macbook: "Apple",
	prestige: "MSI",
	porsche: "Porsche Design",
	"garmin-asus": "Garmin-Asus",
};

/** Brands whose name is written in capitals (kept as they are). */
const UPPERCASE_MAKERS = new Set(["HP", "LG", "MSI", "AOC"]);

const WHITESPACE_REGEX = /\s+/g;
const NON_SLUG_REGEX = /[^a-z0-9]+/g;
const EDGE_DASHES_REGEX = /^-+|-+$/g;
const DIACRITICS_REGEX = /[̀-ͯ]/g;
const FANCY_QUOTES_REGEX = /[″”“]/g;
const RELEASED_IN_STATUS_REGEX = /Released\s+(.+)$/i;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;
const YEAR_MONTH_DAY_REGEX = /(\d{4}),?\s+([A-Za-z]+)(?:\s+(\d{1,2}))?/;
const YEAR_REGEX = /\b(19|20)\d{2}\b/;
const PLACEHOLDER_VALUES = new Set(["", "-", "n/a", "tbc", "to be confirmed"]);

const MONTHS: Record<string, string> = {
	january: "01",
	february: "02",
	march: "03",
	april: "04",
	may: "05",
	june: "06",
	july: "07",
	august: "08",
	september: "09",
	october: "10",
	november: "11",
	december: "12",
};

export function slugify(value: string): string {
	return value
		.normalize("NFKD")
		.replace(DIACRITICS_REGEX, "")
		.toLowerCase()
		.replace(NON_SLUG_REGEX, "-")
		.replace(EDGE_DASHES_REGEX, "");
}

/** Trims, collapses spaces and drops placeholders such as "-". */
export function cleanText(value: string | null | undefined): string | null {
	if (value == null) {
		return null;
	}
	const text = value.replace(WHITESPACE_REGEX, " ").trim();
	return PLACEHOLDER_VALUES.has(text.toLowerCase()) ? null : text;
}

/**
 * The scraper stores some lists as JSON arrays and others as plain text.
 * Lists become one string, joined by `separator`.
 */
export function listText(
	value: string | null | undefined,
	separator = ", "
): string | null {
	const text = cleanText(value);
	if (!text?.startsWith("[")) {
		return text;
	}
	try {
		const items = (JSON.parse(text) as unknown[])
			.map((item) => cleanText(String(item)))
			.filter((item): item is string => item !== null);
		return items.length > 0 ? items.join(separator) : null;
	} catch {
		return text;
	}
}

/** Canonical brand name: "ASUS" and "Asus" are the same maker. */
export function canonicalMaker(name: string): string {
	const trimmed = name.trim();
	const alias = MAKER_ALIASES[trimmed.toLowerCase()];
	if (alias) {
		return alias;
	}
	if (UPPERCASE_MAKERS.has(trimmed.toUpperCase())) {
		return trimmed.toUpperCase();
	}
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * The brand of a model. LaptopMedia files some models under the wrong brand
 * ("HP Victus 15" under ASUS), but its names always start with the brand, so
 * the name wins there.
 */
export function makerOf(
	model: Pick<ScrapedModel, "name" | "makerName">,
	source: SourceName
): string {
	if (source === "laptopmedia") {
		const first = model.name.trim().split(" ")[0] ?? "";
		if (first) {
			return canonicalMaker(first);
		}
	}
	return canonicalMaker(model.makerName);
}

/** Brand typos found at the start of scraped names. */
const NAME_TYPOS: Record<string, string> = { mirrosoft: "Microsoft" };

/**
 * GSMArena names leave the brand out ("Galaxy S24"); the others include it,
 * sometimes in another casing ("ASUS ROG"). Every name starts with the brand.
 */
export function displayName(model: ScrapedModel, maker: string): string {
	let name = (cleanText(model.name) ?? "").replace(FANCY_QUOTES_REGEX, '"');
	const [first = "", ...rest] = name.split(" ");
	const fixed = NAME_TYPOS[first.toLowerCase()];
	if (fixed) {
		name = [fixed, ...rest].join(" ");
	}
	if (name.toLowerCase().startsWith(`${maker.toLowerCase()} `)) {
		return `${maker}${name.slice(maker.length)}`;
	}
	return `${maker} ${name}`;
}

export function categoryOf(category: string | null): CatalogCategory | null {
	return category ? (SCRAPED_CATEGORIES[category] ?? null) : null;
}

/**
 * A date as precise as the source knows it: "2024", "2024-03" or
 * "2024-03-11". Partial ISO dates still sort correctly as text.
 */
export function partialDate(value: string | null | undefined): string | null {
	const text = cleanText(value);
	if (!text) {
		return null;
	}

	const iso = ISO_DATE_REGEX.exec(text);
	if (iso) {
		return `${iso[1]}-${iso[2]}-${iso[3]}`;
	}

	const written = YEAR_MONTH_DAY_REGEX.exec(text);
	const month = written?.[2] ? MONTHS[written[2].toLowerCase()] : undefined;
	if (written && month) {
		const day = written[3] ? `-${written[3].padStart(2, "0")}` : "";
		return `${written[1]}-${month}${day}`;
	}

	return YEAR_REGEX.exec(text)?.[0] ?? null;
}

export type CatalogStatus =
	| "Available"
	| "Discontinued"
	| "Cancelled"
	| "Rumored";

/** GSMArena writes "Available. Released 2024, March 11"; keep the state only. */
export function statusOf(status: string | null): CatalogStatus | null {
	const text = cleanText(status)?.toLowerCase();
	if (!text) {
		return null;
	}
	if (text.startsWith("available")) {
		return "Available";
	}
	if (text.startsWith("discontinued")) {
		return "Discontinued";
	}
	if (text.startsWith("cancelled")) {
		return "Cancelled";
	}
	return "Rumored";
}

/**
 * Release date: the scraped column, else the date in the GSMArena status.
 * LaptopMedia only has the date its review went up, which is close enough.
 */
export function releasedOf(
	model: Pick<ScrapedModel, "released" | "status" | "announced">,
	source: SourceName
): string | null {
	const fromStatus = RELEASED_IN_STATUS_REGEX.exec(model.status ?? "")?.[1];
	return (
		partialDate(model.released) ??
		partialDate(fromStatus) ??
		(source === "laptopmedia" ? partialDate(model.announced) : null)
	);
}

/** Extra specs kept from the scraped `meta` blob, under stable names. */
export interface CatalogMeta {
	network2g?: string;
	network3g?: string;
	network4g?: string;
	network5g?: string;
	networkSpeed?: string;
	wlan?: string;
	bluetooth?: string;
	gps?: string;
	nfc?: string;
	radio?: string;
	usb?: string;
	ram?: string;
	refreshRate?: string;
	panelType?: string;
	backlight?: string;
	brightness?: string;
	staticContrast?: string;
	dynamicContrast?: string;
	colorGamut?: string;
	viewingAngles?: string;
}

const GSM_META_KEYS: Record<string, keyof CatalogMeta> = {
	net2g: "network2g",
	net3g: "network3g",
	net4g: "network4g",
	net5g: "network5g",
	speed: "networkSpeed",
	wlan: "wlan",
	bluetooth: "bluetooth",
	gps: "gps",
	nfc: "nfc",
	radio: "radio",
	usb: "usb",
};

function parseMeta(meta: string | null): Record<string, unknown> {
	if (!meta) {
		return {};
	}
	try {
		const parsed = JSON.parse(meta);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

function colorGamutText(value: string | null | undefined): string | null {
	const gamut = parseMeta(value ?? null);
	const parts = Object.entries(gamut).map(
		([space, share]) => `${share} ${space === "srgb" ? "sRGB" : space}`
	);
	return parts.length > 0 ? parts.join(", ").replace(" %", "%") : null;
}

export function metaOf(
	model: ScrapedModel,
	source: SourceName
): CatalogMeta | null {
	const raw = parseMeta(model.meta);
	const meta: CatalogMeta = {};
	const set = (key: keyof CatalogMeta, value: unknown) => {
		const text = value == null ? null : cleanText(String(value));
		if (text) {
			meta[key] = text;
		}
	};

	if (source === "gsmarena") {
		for (const [from, to] of Object.entries(GSM_META_KEYS)) {
			set(to, raw[from]);
		}
	}

	if (source === "laptopmedia") {
		set("ram", raw.ram ? `${raw.ram} GB` : null);
		const hz = Number(raw.refreshRate);
		set("refreshRate", hz > 0 ? `${hz} Hz` : null);
	}

	if (source === "displayspecs") {
		set("panelType", model.panelType);
		set("backlight", model.backlight);
		set("brightness", model.brightness ? `${model.brightness} cd/m²` : null);
		set("staticContrast", model.staticContrast);
		set("dynamicContrast", model.dynamicContrast);
		set("refreshRate", model.refreshRate);
		set("colorGamut", colorGamutText(model.colorGamut));
		set("viewingAngles", model.viewingAngles);
	}

	return Object.keys(meta).length > 0 ? meta : null;
}

/** LaptopMedia keeps RAM apart from storage; GSMArena writes "128GB 8GB RAM". */
function memoryOf(model: ScrapedModel, meta: CatalogMeta | null) {
	const storage = listText(model.internalMemory);
	if (meta?.ram && storage) {
		return `${storage}, ${meta.ram} RAM`;
	}
	return storage ?? (meta?.ram ? `${meta.ram} RAM` : null);
}

/** One catalog model, ready to be written (ids are resolved by the importer). */
export interface CatalogModel {
	source: SourceName;
	sourceId: number;
	maker: string;
	makerUrl: string;
	category: CatalogCategory | null;
	name: string;
	slug: string;
	url: string;
	imageFile: string | null;
	values: {
		announced: string | null;
		status: CatalogStatus | null;
		dimensions: string | null;
		weight: string | null;
		build: string | null;
		sim: string | null;
		displayType: string | null;
		displaySize: string | null;
		displayResolution: string | null;
		displayProtection: string | null;
		os: string | null;
		chipset: string | null;
		cpu: string | null;
		gpu: string | null;
		cardSlot: string | null;
		internalMemory: string | null;
		mainCamera: string | null;
		mainCameraFeatures: string | null;
		mainCameraVideo: string | null;
		selfieCamera: string | null;
		selfieFeatures: string | null;
		selfieVideo: string | null;
		battery: string | null;
		batteryCharging: string | null;
		networkTech: string | null;
		sensors: string | null;
		colors: string | null;
		colorsHex: string | null;
		modelsText: string | null;
		price: string | null;
		dimensionsWidth: number | null;
		dimensionsHeight: number | null;
		dimensionsThickness: number | null;
		weightGrams: number | null;
		displaySizeInches: number | null;
		displaySizeRatio: string | null;
		displayResWidth: number | null;
		displayResHeight: number | null;
		displayResPpi: number | null;
		released: string | null;
		meta: string | null;
	};
}

/** Slug length leaves room for a "-2" suffix in the 100 char column. */
const SLUG_MAX = 90;

export function toCatalogModel(
	model: ScrapedModel,
	source: SourceName
): Omit<CatalogModel, "slug"> & { baseSlug: string } {
	const maker = makerOf(model, source);
	const name = displayName(model, maker);
	const meta = metaOf(model, source);

	return {
		source,
		sourceId: model.id,
		maker,
		makerUrl: model.makerUrl,
		category: categoryOf(model.category),
		name,
		baseSlug: slugify(name).slice(0, SLUG_MAX).replace(EDGE_DASHES_REGEX, ""),
		url: model.url,
		imageFile: model.imageLocalPath?.split("/").pop() ?? null,
		values: {
			announced: source === "laptopmedia" ? null : partialDate(model.announced),
			status: statusOf(model.status),
			dimensions: listText(model.dimensions),
			weight: listText(model.weight),
			build: listText(model.build),
			sim: listText(model.sim),
			displayType: listText(model.displayType),
			displaySize: listText(model.displaySize),
			displayResolution: listText(model.displayResolution),
			displayProtection: listText(model.displayProtection),
			os: listText(model.os),
			chipset: listText(model.chipset),
			cpu: listText(model.cpu),
			gpu: listText(model.gpu),
			cardSlot: listText(model.cardSlot),
			internalMemory: memoryOf(model, meta),
			mainCamera: listText(model.mainCamera),
			mainCameraFeatures: listText(model.mainCameraFeatures),
			mainCameraVideo: listText(model.mainCameraVideo),
			selfieCamera: listText(model.selfieCamera),
			selfieFeatures: listText(model.selfieFeatures),
			selfieVideo: listText(model.selfieVideo),
			battery: listText(model.battery),
			batteryCharging: listText(model.batteryCharging),
			networkTech: listText(model.networkTech, " / "),
			sensors: listText(model.sensors),
			colors: listText(model.colors),
			colorsHex: listText(model.colorsHex, ","),
			modelsText: listText(model.modelsText),
			price: listText(model.price),
			dimensionsWidth: model.dimensionsWidth,
			dimensionsHeight: model.dimensionsHeight,
			dimensionsThickness: model.dimensionsThickness,
			weightGrams: model.weightGrams,
			displaySizeInches: model.displaySizeInches,
			displaySizeRatio: cleanText(model.displaySizeRatio),
			displayResWidth: model.displayResWidth,
			displayResHeight: model.displayResHeight,
			displayResPpi: model.displayResPpi,
			released: releasedOf(model, source),
			meta: meta ? JSON.stringify(meta) : null,
		},
	};
}

/**
 * Normalizes every source and resolves what only makes sense across rows:
 *
 * - LaptopMedia lists one entry per hardware configuration under the same
 *   name. A shop repairs "the HP Pavilion 15", so only the most recent
 *   configuration of each name is kept.
 * - Slugs must be unique: a repeated name gets "-2", "-3"... in source order,
 *   so the same input always produces the same slugs.
 */
/** LaptopMedia rows that aren't a device, such as "M M" (no brand in the name). */
export function isJunk(model: ScrapedModel, source: SourceName): boolean {
	if (source !== "laptopmedia") {
		return false;
	}
	const words = (cleanText(model.name) ?? "").split(" ");
	return (words[0]?.length ?? 0) < 2;
}

export function buildCatalog(
	sources: { source: SourceName; models: ScrapedModel[] }[]
): CatalogModel[] {
	const byName = new Map<
		string,
		Omit<CatalogModel, "slug"> & { baseSlug: string }
	>();
	const ordered: (Omit<CatalogModel, "slug"> & { baseSlug: string })[] = [];

	for (const { source, models } of sources) {
		const sorted = [...models].sort((a, b) => a.id - b.id);
		for (const scraped of sorted) {
			if (isJunk(scraped, source)) {
				continue;
			}
			const model = toCatalogModel(scraped, source);
			if (source !== "laptopmedia") {
				ordered.push(model);
				continue;
			}
			const key = model.name.toLowerCase();
			const kept = byName.get(key);
			if (!kept) {
				byName.set(key, model);
				ordered.push(model);
			} else if ((model.values.released ?? "") > (kept.values.released ?? "")) {
				ordered[ordered.indexOf(kept)] = model;
				byName.set(key, model);
			}
		}
	}

	const taken = new Set<string>();
	return ordered.map(({ baseSlug, ...model }) => {
		let slug = baseSlug;
		for (let n = 2; taken.has(slug); n++) {
			slug = `${baseSlug}-${n}`;
		}
		taken.add(slug);
		return { ...model, slug };
	});
}
