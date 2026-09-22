export {
	defaultLocale,
	isLocale,
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	type Locale,
	localeNames,
	locales,
} from "./config";
export { resolveLocale } from "./detect";
export { createFormatter, type Formatter } from "./format";
export { catalogs, en, ptBR } from "./locales";
export {
	type FeedbackMessage,
	i18nMessage,
	messageFor,
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
	StaticTranslationKey,
	Translated,
	TranslationArgs,
	TranslationKey,
	TranslationValues,
} from "./types";
