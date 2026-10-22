import { LOCALE_COOKIE } from "@fixr/i18n";
import { describe, expect, it } from "vitest";
import { requestLocale } from "./locale";

const request = (
	cookies: Record<string, string> | undefined,
	acceptLanguage?: string
) =>
	({
		cookies,
		headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
	}) as never;

describe("requestLocale", () => {
	it("prefers the locale the user picked over the browser language", () => {
		expect(requestLocale(request({ [LOCALE_COOKIE]: "en" }, "pt-BR"))).toBe(
			"en"
		);
	});

	it("follows Accept-Language when no locale was picked", () => {
		expect(requestLocale(request({}, "pt-BR,pt;q=0.9,en;q=0.8"))).toBe("pt-BR");
	});

	it("ignores an unsupported cookie value", () => {
		expect(
			requestLocale(request({ [LOCALE_COOKIE]: "klingon" }, "pt-BR"))
		).toBe("pt-BR");
	});

	it("falls back to the default locale without any hint", () => {
		expect(requestLocale(request({}))).toBe("en");
	});

	it("tolerates a request without parsed cookies", () => {
		expect(requestLocale(request(undefined, "pt-BR"))).toBe("pt-BR");
	});
});
