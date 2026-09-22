import { describe, expect, it } from "vitest";
import { i18nMessage, translateMessage } from "./message";
import { createTranslator } from "./translator";

describe("createTranslator", () => {
	it("translates a key in the requested locale", () => {
		expect(createTranslator("en").t("common.actions.save")).toBe("Save");
		expect(createTranslator("pt-BR").t("common.actions.save")).toBe("Salvar");
	});

	it("interpolates values", () => {
		expect(createTranslator("en").t("validation.name.min", { count: 3 })).toBe(
			"The name must be at least 3 characters."
		);
	});

	it("falls back to English when a locale misses a key", () => {
		// Catalogs are typed against English, so this can only happen at
		// runtime with a stale bundle. It must never render an empty string.
		const translator = createTranslator("pt-BR");

		expect(translator.t("common.app.name")).toBe("Fixr");
	});

	it("formats dates, numbers and currency per locale", () => {
		const date = new Date("2026-03-14T12:00:00Z");

		expect(createTranslator("en").format.number(1234.5)).toBe("1,234.5");
		expect(createTranslator("pt-BR").format.number(1234.5)).toBe("1.234,5");
		expect(createTranslator("en").format.date(date, { timeZone: "UTC" })).toBe(
			"Mar 14, 2026"
		);
		expect(createTranslator("pt-BR").format.currency(10)).toContain("10,00");
	});
});

describe("translateMessage", () => {
	it("resolves an encoded schema message", () => {
		const encoded = i18nMessage("validation.name.min", { count: 3 });

		expect(translateMessage(createTranslator("pt-BR"), encoded)).toBe(
			"O nome deve ter no mínimo 3 caracteres."
		);
	});

	it("returns plain text untouched", () => {
		expect(translateMessage(createTranslator("en"), "Raw message")).toBe(
			"Raw message"
		);
	});
});
