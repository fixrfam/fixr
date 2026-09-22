import { describe, expect, it } from "vitest";
import { resolveLocale } from "./detect";

describe("resolveLocale", () => {
	it("prefers the locale the user picked by hand", () => {
		expect(
			resolveLocale({ cookie: "pt-BR", acceptLanguage: "en-US,en;q=0.9" })
		).toBe("pt-BR");
	});

	it("ignores a cookie holding an unsupported locale", () => {
		expect(resolveLocale({ cookie: "fr-FR", acceptLanguage: "pt-BR" })).toBe(
			"pt-BR"
		);
	});

	it("falls back to the browser language, honouring quality values", () => {
		expect(
			resolveLocale({ acceptLanguage: "fr-FR,en;q=0.7,pt-BR;q=0.9" })
		).toBe("pt-BR");
	});

	it("matches on the primary subtag, so pt-PT still gets Portuguese", () => {
		expect(resolveLocale({ acceptLanguage: "pt-PT" })).toBe("pt-BR");
	});

	it("defaults to English when nothing matches", () => {
		expect(resolveLocale({ acceptLanguage: "ja,ko;q=0.8" })).toBe("en");
		expect(resolveLocale({})).toBe("en");
	});
});
