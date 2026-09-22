import { hasTranslation, type Translator } from "./translator";
import type { TranslationArgs, TranslationKey } from "./types";

/**
 * Marks a string as "this is a translation key, not text".
 *
 * Schemas run on the server, where the reader's language is unknown, so they
 * emit encoded keys (`@i18n:validation.name.min?count=3`) and whoever renders
 * the message resolves it.
 */
const PREFIX = "@i18n:";

export function i18nMessage<K extends TranslationKey>(
	key: K,
	...args: TranslationArgs<K>
): string {
	const values = args[0] as Record<string, string | number> | undefined;

	if (!values) {
		return `${PREFIX}${key}`;
	}

	const params = new URLSearchParams(
		Object.entries(values).map(([name, value]) => [name, String(value)])
	);

	return `${PREFIX}${key}?${params.toString()}`;
}

export interface ParsedMessage {
	key: TranslationKey;
	values: Record<string, string>;
}

/** Reads back a message written by `i18nMessage`. Returns null for plain text. */
export function parseI18nMessage(value: string): ParsedMessage | null {
	if (!value.startsWith(PREFIX)) {
		return null;
	}

	const [key, query] = value.slice(PREFIX.length).split("?");

	if (!(key && hasTranslation(key))) {
		return null;
	}

	return {
		key,
		values: query ? Object.fromEntries(new URLSearchParams(query)) : {},
	};
}

/**
 * Translates a message that may or may not be an encoded key.
 *
 * Anything that is not ours (a raw API message, a zod default) is returned
 * untouched, so nothing ever renders as a blank string.
 */
export function translateMessage(
	translator: Translator,
	value: string
): string {
	const parsed = parseI18nMessage(value);

	if (!parsed) {
		return value;
	}

	/**
	 * The key is only known at runtime here, so the typed signature cannot
	 * help: widen it once, in this single place.
	 */
	const translate = translator.t as (
		key: string,
		values?: Record<string, string>
	) => string;

	return translate(parsed.key, parsed.values);
}
