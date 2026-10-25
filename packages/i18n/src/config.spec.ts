import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, localeNames, locales } from "./config";

describe("isLocale", () => {
	it.each(locales)("accepts %s", (locale) => {
		expect(isLocale(locale)).toBe(true);
	});

	it.each([
		"pt",
		"pt-br",
		"fr",
		"",
		undefined,
		null,
		42,
	])("rejects %j", (value) => {
		expect(isLocale(value)).toBe(false);
	});
});

describe("locale config", () => {
	it("ships a supported default locale", () => {
		expect(locales).toContain(defaultLocale);
	});

	it("names every locale for the language switcher", () => {
		expect(Object.keys(localeNames).sort()).toEqual([...locales].sort());
	});
});
