import { describe, expect, it } from "vitest";
import { type Locale, locales } from "./config";
import { catalogs, en } from "./locales";
import type { Catalog } from "./types";

const PLACEHOLDER = /{{\s*([^}]+?)\s*}}/g;

function flatten(catalog: Catalog, prefix = ""): Map<string, string> {
	const entries = new Map<string, string>();

	for (const [key, value] of Object.entries(catalog)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (typeof value === "string") {
			entries.set(path, value);
		} else {
			for (const [nested, text] of flatten(value, path)) {
				entries.set(nested, text);
			}
		}
	}

	return entries;
}

function placeholdersOf(message: string): string[] {
	return [...message.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

const english = flatten(en as unknown as Catalog);

describe.each(
	locales.filter((locale) => locale !== "en")
)("%s catalog", (locale: Locale) => {
	const translated = flatten(catalogs[locale] as unknown as Catalog);

	it("covers every English key and adds none of its own", () => {
		expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
	});

	it("interpolates the same values as English", () => {
		for (const [key, message] of english) {
			expect({
				key,
				values: placeholdersOf(translated.get(key) ?? ""),
			}).toEqual({ key, values: placeholdersOf(message) });
		}
	});

	it("leaves no message empty", () => {
		for (const [key, message] of translated) {
			expect({ key, empty: message.trim().length === 0 }).toEqual({
				key,
				empty: false,
			});
		}
	});
});
