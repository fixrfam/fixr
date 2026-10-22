import {
	createTranslator,
	LOCALE_COOKIE,
	type Locale,
	resolveLocale,
	type Translator,
} from "@fixr/i18n";
import { cookies, headers } from "next/headers";

/**
 * Locale for the current request: the language the user picked by hand,
 * otherwise the one their browser asks for.
 */
export async function getLocale(): Promise<Locale> {
	const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);

	return resolveLocale({
		cookie: cookieStore.get(LOCALE_COOKIE)?.value,
		acceptLanguage: headerList.get("accept-language"),
	});
}

/** Translations for server components, metadata and route handlers. */
export async function getTranslator(): Promise<Translator> {
	return createTranslator(await getLocale());
}
