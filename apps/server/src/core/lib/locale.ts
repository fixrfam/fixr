import { LOCALE_COOKIE, type Locale, resolveLocale } from "@fixr/i18n";
import type { FastifyRequest } from "fastify";

/**
 * Language to answer a request in.
 *
 * The API itself stays language agnostic (it returns codes, not copy), but
 * emails are rendered here, so they follow whoever triggered them: the locale
 * the user picked, otherwise what their browser asks for.
 */
export function requestLocale(request: FastifyRequest): Locale {
	const cookies = request.cookies as Record<string, string | undefined>;

	return resolveLocale({
		cookie: cookies?.[LOCALE_COOKIE],
		acceptLanguage: request.headers["accept-language"],
	});
}
