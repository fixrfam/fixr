import type { Locale } from "./config";

/**
 * Currency the product charges in. The locale changes how an amount is
 * written, never which currency it is.
 */
const DEFAULT_CURRENCY = "BRL";

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export interface Formatter {
	/** Formats a date (or ISO string) for the active locale. */
	date(
		value: Date | string | number,
		options?: Intl.DateTimeFormatOptions
	): string;
	/** Formats a date including hours and minutes. */
	dateTime(
		value: Date | string | number,
		options?: Intl.DateTimeFormatOptions
	): string;
	number(value: number, options?: Intl.NumberFormatOptions): string;
	/** Formats an amount of money. Defaults to BRL, the currency we charge in. */
	currency(value: number, currency?: string): string;
	/** Formats a distance in time, e.g. "2 days ago". */
	relativeTime(value: Date | string | number, now?: Date): string;
}

function toDate(value: Date | string | number): Date {
	return value instanceof Date ? value : new Date(value);
}

interface RelativeUnit {
	limitInDays: number;
	unit: Intl.RelativeTimeFormatUnit;
	divisorInDays: number;
}

const RELATIVE_UNITS: RelativeUnit[] = [
	{ limitInDays: DAYS_PER_WEEK, unit: "day", divisorInDays: 1 },
	{ limitInDays: DAYS_PER_MONTH, unit: "week", divisorInDays: DAYS_PER_WEEK },
	{ limitInDays: DAYS_PER_YEAR, unit: "month", divisorInDays: DAYS_PER_MONTH },
	{
		limitInDays: Number.POSITIVE_INFINITY,
		unit: "year",
		divisorInDays: DAYS_PER_YEAR,
	},
];

function relativeParts(diffInMilliseconds: number): {
	value: number;
	unit: Intl.RelativeTimeFormatUnit;
} {
	const seconds = diffInMilliseconds / MILLISECONDS_PER_SECOND;
	const minutes = seconds / SECONDS_PER_MINUTE;
	const hours = minutes / MINUTES_PER_HOUR;
	const days = hours / HOURS_PER_DAY;

	if (Math.abs(seconds) < SECONDS_PER_MINUTE) {
		return { value: Math.round(seconds), unit: "second" };
	}

	if (Math.abs(minutes) < MINUTES_PER_HOUR) {
		return { value: Math.round(minutes), unit: "minute" };
	}

	if (Math.abs(hours) < HOURS_PER_DAY) {
		return { value: Math.round(hours), unit: "hour" };
	}

	const match =
		RELATIVE_UNITS.find(({ limitInDays }) => Math.abs(days) < limitInDays) ??
		// biome-ignore lint/style/useAtIndex: the API targets ES2020, where Array.prototype.at does not exist yet.
		RELATIVE_UNITS[RELATIVE_UNITS.length - 1];

	return {
		value: Math.round(days / (match?.divisorInDays ?? 1)),
		unit: match?.unit ?? "day",
	};
}

/** Intl wrappers bound to a locale, so dates and numbers follow the language. */
export function createFormatter(locale: Locale): Formatter {
	return {
		date(value, options) {
			return new Intl.DateTimeFormat(locale, {
				dateStyle: "medium",
				...options,
			}).format(toDate(value));
		},
		dateTime(value, options) {
			return new Intl.DateTimeFormat(locale, {
				dateStyle: "medium",
				timeStyle: "short",
				...options,
			}).format(toDate(value));
		},
		number(value, options) {
			return new Intl.NumberFormat(locale, options).format(value);
		},
		currency(value, currency = DEFAULT_CURRENCY) {
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency,
			}).format(value);
		},
		relativeTime(value, now = new Date()) {
			const { value: amount, unit } = relativeParts(
				toDate(value).getTime() - now.getTime()
			);

			return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
				amount,
				unit
			);
		},
	};
}
