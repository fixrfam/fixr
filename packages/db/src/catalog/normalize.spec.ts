import { describe, expect, it } from "vitest";
import {
	buildCatalog,
	canonicalMaker,
	cleanText,
	listText,
	makerOf,
	metaOf,
	partialDate,
	releasedOf,
	type ScrapedModel,
	statusOf,
	toCatalogModel,
} from "./normalize";

const scraped = (overrides: Partial<ScrapedModel> = {}): ScrapedModel =>
	({
		id: 1,
		makerName: "Samsung",
		makerUrl: "https://www.gsmarena.com/samsung-phones-9.php",
		name: "Galaxy S25",
		url: "https://www.gsmarena.com/samsung_galaxy_s25-13610.php",
		imageLocalPath: "./data/images/models/samsung_galaxy_s25-13610.jpg",
		category: "phone",
		...overrides,
	}) as ScrapedModel;

describe("cleanText", () => {
	it("drops placeholders and collapses whitespace", () => {
		expect(cleanText(" - ")).toBeNull();
		expect(cleanText("TBC")).toBeNull();
		expect(cleanText("  6.1  inches ")).toBe("6.1 inches");
	});
});

describe("listText", () => {
	it("joins JSON arrays and keeps plain text", () => {
		expect(listText('["GSM","LTE","5G"]', " / ")).toBe("GSM / LTE / 5G");
		expect(listText("Black, White")).toBe("Black, White");
		expect(listText("[]")).toBeNull();
	});
});

describe("makers", () => {
	it("merges spellings of the same brand", () => {
		expect(canonicalMaker("ASUS")).toBe("Asus");
		expect(canonicalMaker("hp")).toBe("HP");
		expect(canonicalMaker("Mirrosoft")).toBe("Microsoft");
	});

	it("takes LaptopMedia brands from the name, since some rows are misfiled", () => {
		expect(
			makerOf({ name: "HP Victus 15", makerName: "ASUS" }, "laptopmedia")
		).toBe("HP");
		expect(
			makerOf({ name: "Galaxy S25", makerName: "Samsung" }, "gsmarena")
		).toBe("Samsung");
	});
});

describe("dates and status", () => {
	it("keeps dates as precise as the source knows them", () => {
		expect(partialDate("2026, March 2")).toBe("2026-03-02");
		expect(partialDate("2007, February")).toBe("2007-02");
		expect(partialDate("2005, Q1")).toBe("2005");
		expect(partialDate("2017-07-12 00:17:27")).toBe("2017-07-12");
		expect(partialDate("Not announced yet")).toBeNull();
	});

	it("reads the release date from the GSMArena status", () => {
		expect(
			releasedOf(
				{
					released: null,
					status: "Available. Released 2025, October 22",
					announced: null,
				},
				"gsmarena"
			)
		).toBe("2025-10-22");
	});

	it("maps the scraped status to the catalog statuses", () => {
		expect(statusOf("Available. Released 2021, May")).toBe("Available");
		expect(statusOf("Coming soon. Exp. release 2026")).toBe("Rumored");
		expect(statusOf("Cancelled")).toBe("Cancelled");
		expect(statusOf(null)).toBeNull();
	});
});

describe("toCatalogModel", () => {
	it("prefixes GSMArena names with the brand", () => {
		const model = toCatalogModel(scraped(), "gsmarena");

		expect(model.name).toBe("Samsung Galaxy S25");
		expect(model.baseSlug).toBe("samsung-galaxy-s25");
		expect(model.category).toBe("smartphone");
		expect(model.imageFile).toBe("samsung_galaxy_s25-13610.jpg");
	});

	it("doesn't repeat the brand and fixes its casing", () => {
		const model = toCatalogModel(
			scraped({ name: "ASUS ROG Zephyrus G14", makerName: "ASUS" }),
			"laptopmedia"
		);

		expect(model.name).toBe("Asus ROG Zephyrus G14");
	});

	it("joins LaptopMedia storage and RAM", () => {
		const model = toCatalogModel(
			scraped({
				name: "HP Pavilion 15",
				category: "laptop",
				internalMemory: "512 GB SSD",
				meta: '{"ram":16,"refreshRate":"0.0","buyUrl":"https://example.com"}',
			}),
			"laptopmedia"
		);

		expect(model.values.internalMemory).toBe("512 GB SSD, 16 GB RAM");
		expect(JSON.parse(model.values.meta!)).toEqual({ ram: "16 GB" });
	});
});

describe("metaOf", () => {
	it("keeps monitor specs under stable names", () => {
		const meta = metaOf(
			scraped({
				panelType: "VA",
				brightness: 300,
				colorGamut: '{"srgb":"99 %"}',
				refreshRate: "48 Hz - 200 Hz",
			}),
			"displayspecs"
		);

		expect(meta).toEqual({
			panelType: "VA",
			brightness: "300 cd/m²",
			colorGamut: "99% sRGB",
			refreshRate: "48 Hz - 200 Hz",
		});
	});
});

describe("buildCatalog", () => {
	it("keeps the newest LaptopMedia configuration of each name", () => {
		const catalog = buildCatalog([
			{
				source: "laptopmedia",
				models: [
					scraped({
						id: 1,
						name: "HP Pavilion 15",
						url: "a",
						announced: "2024-01-01",
					}),
					scraped({
						id: 2,
						name: "HP Pavilion 15",
						url: "b",
						announced: "2026-01-01",
					}),
					scraped({ id: 3, name: "M M", url: "c" }),
				],
			},
		]);

		expect(catalog.map((model) => model.url)).toEqual(["b"]);
	});

	it("gives repeated names unique slugs in source order", () => {
		const catalog = buildCatalog([
			{
				source: "gsmarena",
				models: [scraped({ id: 2, url: "b" }), scraped({ id: 1, url: "a" })],
			},
		]);

		expect(catalog.map((model) => [model.url, model.slug])).toEqual([
			["a", "samsung-galaxy-s25"],
			["b", "samsung-galaxy-s25-2"],
		]);
	});
});
