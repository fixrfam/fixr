import { cookieKey } from "@fixr/constants/cookies";

/** Every locale the product ships. Adding one here makes the catalogs required. */
export const locales = ["en", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

/** Locale used when nothing else can be resolved, and fallback for missing keys. */
export const defaultLocale: Locale = "en";

/** Name of each locale, written in that locale. Used by the language switcher. */
export const localeNames: Record<Locale, string> = {
	en: "English",
	"pt-BR": "Português (Brasil)",
};

/**
 * Cookie holding the locale the user picked by hand.
 * It always wins over the language advertised by the browser.
 */
export const LOCALE_COOKIE = cookieKey("locale");

/** Header the middleware sets so server components can read the resolved locale. */
export const LOCALE_HEADER = "x-fixr-locale";

/** How long a manual locale choice is remembered, in seconds. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
	return (
		typeof value === "string" && locales.includes(value as Locale)
	);
}
