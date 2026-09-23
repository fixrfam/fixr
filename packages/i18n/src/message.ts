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

/**
 * Keys resolved at runtime (an API code, a schema message) cannot be checked
 * by the typed signature, so widening happens here and nowhere else.
 */
function translate(
	translator: Translator,
	key: string,
	values?: Record<string, string>
): string {
	const loose = translator.t as (
		loosekey: string,
		loosevalues?: Record<string, string>
	) => string;

	return loose(key, values);
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

	return translate(translator, parsed.key, parsed.values);
}

export interface FeedbackMessage {
	title: string;
	description: string;
}

/**
 * Copy for the `code` the API answered with.
 *
 * Unknown codes (a new one shipped by the backend, an unmapped failure) fall
 * back to a generic message instead of rendering the raw code.
 */
export function messageFor(
	translator: Translator,
	code: string | undefined,
	fallback: "success" | "error" = "error"
): FeedbackMessage {
	const titleKey = `messages.codes.${code}.title`;
	const descriptionKey = `messages.codes.${code}.description`;

	if (code && hasTranslation(titleKey) && hasTranslation(descriptionKey)) {
		return {
			title: translate(translator, titleKey),
			description: translate(translator, descriptionKey),
		};
	}

	return {
		title: translator.t(`messages.fallback.${fallback}.title`),
		description: translator.t(`messages.fallback.${fallback}.description`),
	};
}
