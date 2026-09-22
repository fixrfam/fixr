"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	defaultLocale,
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	type Locale,
} from "./config";
import type { Formatter } from "./format";
import { createTranslator, type Translator } from "./translator";
import type { TranslationArgs, TranslationKey } from "./types";

interface I18nContextValue {
	locale: Locale;
	t: Translator["t"];
	format: Formatter;
	/** Switches language, remembers the choice and re-renders the tree. */
	setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: Locale) {
	if (typeof document === "undefined") {
		return;
	}

	document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export interface I18nProviderProps {
	children: ReactNode;
	/** Locale resolved on the server, so the first paint is already correct. */
	locale: Locale;
	/**
	 * Called after the user picks another language. Apps use it to refresh
	 * server-rendered content, which is translated outside React.
	 */
	onLocaleChange?: (locale: Locale) => void;
}

export function I18nProvider({
	children,
	locale: initialLocale,
	onLocaleChange,
}: I18nProviderProps) {
	const [locale, setLocaleState] = useState<Locale>(initialLocale);

	// The server is the source of truth: follow it when it changes.
	useEffect(() => {
		setLocaleState(initialLocale);
	}, [initialLocale]);

	const setLocale = useCallback(
		(next: Locale) => {
			persistLocale(next);
			setLocaleState(next);
			onLocaleChange?.(next);
		},
		[onLocaleChange]
	);

	const value = useMemo<I18nContextValue>(() => {
		const translator = createTranslator(locale);

		return {
			locale,
			t: translator.t,
			format: translator.format,
			setLocale,
		};
	}, [locale, setLocale]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nContextValue {
	const context = useContext(I18nContext);

	if (context) {
		return context;
	}

	/**
	 * Outside a provider (a stray render, a test) we still return something
	 * usable in the default locale instead of throwing at the user.
	 */
	const fallback = createTranslator(defaultLocale);

	return {
		locale: defaultLocale,
		t: fallback.t,
		format: fallback.format,
		setLocale: persistLocale,
	};
}

/** Typed translations for client components. */
export function useTranslation(): I18nContextValue {
	return useI18nContext();
}

/** Just the active locale, for components that only need to format. */
export function useLocale(): Locale {
	return useI18nContext().locale;
}

/** Dates, numbers and currency in the active locale. */
export function useFormatter(): Formatter {
	return useI18nContext().format;
}

export type { Locale, TranslationArgs, TranslationKey };
