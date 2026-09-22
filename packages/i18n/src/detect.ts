import { defaultLocale, isLocale, type Locale, locales } from "./config";

interface AcceptLanguageEntry {
	tag: string;
	quality: number;
}

const DEFAULT_QUALITY = 1;

function parseAcceptLanguage(header: string): AcceptLanguageEntry[] {
	return header
		.split(",")
		.map((part) => {
			const [tag, ...params] = part.trim().split(";");
			const qualityParam = params.find((param) =>
				param.trim().startsWith("q=")
			);
			const quality = qualityParam
				? Number.parseFloat(qualityParam.trim().slice(2))
				: DEFAULT_QUALITY;

			return {
				tag: (tag ?? "").trim(),
				quality: Number.isNaN(quality) ? 0 : quality,
			};
		})
		.filter((entry) => entry.tag.length > 0)
		.sort((a, b) => b.quality - a.quality);
}

/**
 * Matches a single language tag against the supported locales.
 *
 * Exact matches win (`pt-BR`), then the primary subtag (`pt` -> `pt-BR`),
 * so a browser asking for `pt-PT` still gets Portuguese instead of English.
 */
function matchLocale(tag: string): Locale | null {
	const normalized = tag.toLowerCase();

	const exact = locales.find((locale) => locale.toLowerCase() === normalized);
	if (exact) {
		return exact;
	}

	const primary = normalized.split("-")[0];
	const byPrimary = locales.find(
		(locale) => locale.toLowerCase().split("-")[0] === primary
	);

	return byPrimary ?? null;
}

/**
 * Resolves which locale to serve.
 *
 * Priority: the locale the user picked by hand, then what the browser asks
 * for, then the default. Never throws: an unknown value is simply ignored.
 */
export function resolveLocale({
	cookie,
	acceptLanguage,
}: {
	cookie?: string | null;
	acceptLanguage?: string | null;
}): Locale {
	if (isLocale(cookie)) {
		return cookie;
	}

	if (acceptLanguage) {
		for (const entry of parseAcceptLanguage(acceptLanguage)) {
			const matched = matchLocale(entry.tag);
			if (matched) {
				return matched;
			}
		}
	}

	return defaultLocale;
}
