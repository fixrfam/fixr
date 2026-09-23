import type { en } from "./locales/en";

/** Shape every catalog follows: nested objects of strings, no arrays. */
export interface Catalog {
	[key: string]: string | Catalog;
}

/**
 * The English catalog is the source of truth. Every other locale is typed
 * against this shape, so a missing or misspelled key fails `check-types`.
 */
export type Messages = typeof en;

/** Same keys as `T`, but any string value is accepted (not the English literal). */
export type Translated<T> = {
	[K in keyof T]: T[K] extends string ? string : Translated<T[K]>;
};

type Join<Prefix extends string, Key extends string> = Prefix extends ""
	? Key
	: `${Prefix}.${Key}`;

type Paths<T, Prefix extends string = ""> = {
	[K in keyof T & string]: T[K] extends string
		? Join<Prefix, K>
		: Paths<T[K], Join<Prefix, K>>;
}[keyof T & string];

/** Plural variants live in the catalog as `key_one` / `key_other` (i18next). */
type StripPluralSuffix<K extends string> = K extends `${infer Base}_one`
	? Base
	: K extends `${infer Base}_other`
		? Base
		: K;

/** Every key that can be handed to `t`, as a dot path. */
export type TranslationKey = StripPluralSuffix<Paths<Messages>>;

type ValueAt<T, K extends string> = K extends `${infer Head}.${infer Rest}`
	? Head extends keyof T
		? ValueAt<T[Head], Rest>
		: never
	: K extends keyof T
		? T[K]
		: never;

/** The English text behind a key, resolving plural keys to their `_other` form. */
type MessageOf<K extends TranslationKey> = [ValueAt<Messages, K>] extends [
	never,
]
	? ValueAt<Messages, `${K}_other`>
	: ValueAt<Messages, K>;

type IsPlural<K extends TranslationKey> = [ValueAt<Messages, K>] extends [never]
	? [ValueAt<Messages, `${K}_other`>] extends [never]
		? false
		: true
	: false;

type Whitespace = " " | "\n" | "\t";

type Trim<S extends string> = S extends `${Whitespace}${infer Rest}`
	? Trim<Rest>
	: S extends `${infer Rest}${Whitespace}`
		? Trim<Rest>
		: S;

/** Pulls `{{name}}` placeholders out of a message so `t` can demand them. */
type Placeholders<S> = S extends `${string}{{${infer Name}}}${infer Rest}`
	? Trim<Name> | Placeholders<Rest>
	: never;

type PlaceholderNames<K extends TranslationKey> =
	| Placeholders<MessageOf<K>>
	| (IsPlural<K> extends true ? "count" : never);

/**
 * Keys whose message interpolates nothing.
 *
 * Data that carries a key around (menu entries, route names) should be typed
 * with this: `t` then accepts it without demanding values it cannot know.
 */
export type StaticTranslationKey = {
	[K in TranslationKey]: [PlaceholderNames<K>] extends [never] ? K : never;
}[TranslationKey];

export type TranslationValues<K extends TranslationKey> = Record<
	PlaceholderNames<K>,
	string | number
>;

/**
 * Values are required only when the message actually interpolates something,
 * so `t("common.actions.save")` stays a one-argument call.
 */
export type TranslationArgs<K extends TranslationKey> = [
	PlaceholderNames<K>,
] extends [never]
	? []
	: [values: TranslationValues<K>];
