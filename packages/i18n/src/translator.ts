import i18next, { type i18n as I18nextInstance } from "i18next";
import { defaultLocale, type Locale } from "./config";
import { createFormatter, type Formatter } from "./format";
import { catalogs } from "./locales";
import type { TranslationArgs, TranslationKey } from "./types";

/**
 * i18next is an implementation detail. Nothing outside this package imports
 * it: apps depend on `Translator`, so the engine can be swapped without
 * touching a single component.
 */
export const NAMESPACE = "translation";

export interface Translator {
	/** Locale this translator was built for. */
	locale: Locale;
	/** Translates a key. Values are required when the message interpolates. */
	t<K extends TranslationKey>(key: K, ...args: TranslationArgs<K>): string;
	/** Dates, numbers and currency bound to the same locale. */
	format: Formatter;
}

export interface TranslatorOptions {
	/**
	 * Escapes interpolated values. Turn it on where the result is injected as
	 * HTML (emails), keep it off for React, which escapes on its own.
	 */
	escapeValues?: boolean;
}

function buildResources() {
	return Object.fromEntries(
		Object.entries(catalogs).map(([locale, catalog]) => [
			locale,
			{ [NAMESPACE]: catalog },
		])
	);
}

/** Instances are reused: building one parses every catalog. */
const instances = new Map<string, I18nextInstance>();

export function createI18nInstance(
	locale: Locale,
	{ escapeValues = false }: TranslatorOptions = {}
): I18nextInstance {
	const cacheKey = `${locale}:${escapeValues}`;
	const cached = instances.get(cacheKey);

	if (cached) {
		return cached;
	}

	const instance = i18next.createInstance();

	instance.init({
		lng: locale,
		fallbackLng: defaultLocale,
		defaultNS: NAMESPACE,
		ns: [NAMESPACE],
		resources: buildResources(),
		// Catalogs are bundled, so there is nothing to wait for.
		initImmediate: false,
		// Keeps i18next's sponsor banner out of the API and worker logs.
		showSupportNotice: false,
		interpolation: { escapeValue: escapeValues },
		returnNull: false,
	});

	instances.set(cacheKey, instance);

	return instance;
}

/**
 * Builds a translator for a locale. Works anywhere: server components,
 * Fastify handlers, queue workers and email rendering.
 */
export function createTranslator(
	locale: Locale,
	options?: TranslatorOptions
): Translator {
	const instance = createI18nInstance(locale, options);

	return {
		locale,
		t: (key, ...args) => {
			const values = args[0] as Record<string, unknown> | undefined;

			return String(instance.t(key, values ?? {}));
		},
		format: createFormatter(locale),
	};
}

/** Whether a string is a key we can translate. Used to guard dynamic codes. */
export function hasTranslation(key: string): key is TranslationKey {
	return createI18nInstance(defaultLocale).exists(key);
}
