export {
	defaultLocale,
	isLocale,
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	LOCALE_HEADER,
	type Locale,
	localeNames,
	locales,
} from "./config";
export { resolveLocale } from "./detect";
export { createFormatter, type Formatter } from "./format";
export { catalogs, en, ptBR } from "./locales";
export {
	i18nMessage,
	type ParsedMessage,
	parseI18nMessage,
	translateMessage,
} from "./message";
export {
	createTranslator,
	hasTranslation,
	type Translator,
	type TranslatorOptions,
} from "./translator";
export type {
	Catalog,
	Messages,
	TranslationArgs,
	TranslationKey,
	TranslationValues,
	Translated,
} from "./types";
