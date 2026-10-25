import { LOCALE_COOKIE } from "@fixr/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => ({
	cookies: new Map<string, string>(),
	headers: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) => {
			const value = request.cookies.get(name);
			return value === undefined ? undefined : { name, value };
		},
	}),
	headers: async () => ({
		get: (name: string) => request.headers.get(name) ?? null,
	}),
}));

const { getLocale, getTranslator } = await import("./server");

beforeEach(() => {
	request.cookies.clear();
	request.headers.clear();
});

describe("getLocale", () => {
	it("uses the language the user picked", async () => {
		request.cookies.set(LOCALE_COOKIE, "en");
		request.headers.set("accept-language", "pt-BR");

		expect(await getLocale()).toBe("en");
	});

	it("falls back to the browser language", async () => {
		request.headers.set("accept-language", "pt-PT,pt;q=0.9");

		expect(await getLocale()).toBe("pt-BR");
	});

	it("defaults to English without any hint", async () => {
		expect(await getLocale()).toBe("en");
	});
});

describe("getTranslator", () => {
	it("translates in the request's locale", async () => {
		request.cookies.set(LOCALE_COOKIE, "pt-BR");

		const translator = await getTranslator();

		expect(translator.locale).toBe("pt-BR");
		expect(translator.t("common.actions.save")).toBe("Salvar");
	});
});
