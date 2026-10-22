import { describe, expect, it } from "vitest";
import {
	i18nMessage,
	messageFor,
	parseI18nMessage,
	translateMessage,
} from "./message";
import { createTranslator } from "./translator";

const en = createTranslator("en");
const ptBR = createTranslator("pt-BR");

describe("i18nMessage", () => {
	it("encodes a key without values", () => {
		expect(i18nMessage("validation.email.invalid")).toBe(
			"@i18n:validation.email.invalid"
		);
	});

	it("encodes interpolation values as a query string", () => {
		expect(i18nMessage("validation.name.min", { count: 3 })).toBe(
			"@i18n:validation.name.min?count=3"
		);
	});
});

describe("parseI18nMessage", () => {
	it("reads back the key and its values", () => {
		expect(
			parseI18nMessage(i18nMessage("validation.name.min", { count: 3 }))
		).toEqual({ key: "validation.name.min", values: { count: "3" } });
	});

	it("returns empty values for a key without them", () => {
		expect(parseI18nMessage(i18nMessage("validation.email.invalid"))).toEqual({
			key: "validation.email.invalid",
			values: {},
		});
	});

	it("returns null for plain text", () => {
		expect(parseI18nMessage("Invalid email")).toBeNull();
	});

	it("returns null for a prefixed key missing from the catalog", () => {
		expect(parseI18nMessage("@i18n:does.not.exist")).toBeNull();
		expect(parseI18nMessage("@i18n:")).toBeNull();
	});

	it("survives values that need URL encoding", () => {
		const encoded = i18nMessage("validation.name.min", {
			count: "a&b=c d" as never,
		});

		expect(parseI18nMessage(encoded)?.values).toEqual({ count: "a&b=c d" });
	});
});

describe("translateMessage", () => {
	it("translates an encoded key in the translator's locale", () => {
		const encoded = i18nMessage("validation.name.min", { count: 3 });

		expect(translateMessage(en, encoded)).toBe(
			"The name must be at least 3 characters."
		);
	});

	it("returns an unknown encoded key untouched instead of a blank", () => {
		expect(translateMessage(en, "@i18n:does.not.exist")).toBe(
			"@i18n:does.not.exist"
		);
	});
});

describe("messageFor", () => {
	it("resolves an API code into a title and a description", () => {
		expect(messageFor(en, "subdomain_taken")).toEqual({
			title: en.t("messages.codes.subdomain_taken.title"),
			description: en.t("messages.codes.subdomain_taken.description"),
		});
	});

	it("follows the translator's locale", () => {
		expect(messageFor(ptBR, "subdomain_taken").title).toBe(
			ptBR.t("messages.codes.subdomain_taken.title")
		);
		expect(messageFor(ptBR, "subdomain_taken").title).not.toBe(
			messageFor(en, "subdomain_taken").title
		);
	});

	it("falls back to the generic error for an unknown code", () => {
		expect(messageFor(en, "brand_new_backend_code")).toEqual({
			title: en.t("messages.fallback.error.title"),
			description: en.t("messages.fallback.error.description"),
		});
	});

	it("falls back to the generic error when there is no code", () => {
		expect(messageFor(en, undefined).title).toBe(
			en.t("messages.fallback.error.title")
		);
	});

	it("uses the success fallback when asked to", () => {
		expect(messageFor(en, undefined, "success")).toEqual({
			title: en.t("messages.fallback.success.title"),
			description: en.t("messages.fallback.success.description"),
		});
	});
});
