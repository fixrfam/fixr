import { describe, expect, it } from "vitest";
import {
	batteryCapacity,
	categoryIcon,
	firstOption,
	formatPartialDate,
	parseMeta,
	releaseYear,
	swatches,
} from "./format";

describe("formatPartialDate", () => {
	it("shows only the precision the catalog has", () => {
		expect(formatPartialDate("2024", "en")).toBe("2024");
		expect(formatPartialDate("2024-03", "en")).toBe("March 2024");
		expect(formatPartialDate("2024-03-11", "en")).toBe("Mar 11, 2024");
	});

	it("keeps free text from custom models", () => {
		expect(formatPartialDate("Q3 next year", "en")).toBe("Q3 next year");
		expect(formatPartialDate(null, "en")).toBeNull();
	});
});

describe("model summaries", () => {
	it("takes the year from the release, else from the announcement", () => {
		expect(releaseYear({ released: "2025-02-03", announced: "2025-01" })).toBe(
			"2025"
		);
		expect(releaseYear({ released: null, announced: "2019" })).toBe("2019");
		expect(releaseYear({ released: null, announced: null })).toBeNull();
	});

	it("reads the battery capacity", () => {
		expect(batteryCapacity("Li-Ion 5000 mAh, non-removable")).toBe("5000 mAh");
		expect(batteryCapacity("Li-Ion")).toBeNull();
	});

	it("pairs color names with their hex codes", () => {
		expect(swatches("Black, White", "#171717,#FAFAFA")).toEqual([
			{ name: "Black", hex: "#171717" },
			{ name: "White", hex: "#FAFAFA" },
		]);
		expect(swatches(null, null)).toEqual([]);
	});

	it("shows the first configuration of a list", () => {
		expect(firstOption("256GB 8GB RAM, 512GB 8GB RAM")).toBe("256GB 8GB RAM");
	});

	it("falls back to the phone icon for unknown categories", () => {
		expect(categoryIcon("toaster")).toBe(categoryIcon("smartphone"));
	});
});

describe("parseMeta", () => {
	it("reads the known keys and ignores broken JSON", () => {
		expect(parseMeta('{"wlan":"Wi-Fi 6","nfc":"Yes"}')).toEqual({
			wlan: "Wi-Fi 6",
			nfc: "Yes",
		});
		expect(parseMeta("{oops")).toEqual({});
	});
});
