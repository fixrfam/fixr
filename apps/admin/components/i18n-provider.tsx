"use client";

import {
	I18nProvider as BaseI18nProvider,
	type Locale,
} from "@fixr/i18n/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wires the shared provider to the router: server components are translated
 * on the server, so switching language has to re-fetch them.
 */
export function I18nProvider({
	children,
	locale,
}: {
	children: ReactNode;
	locale: Locale;
}) {
	const router = useRouter();

	return (
		<BaseI18nProvider locale={locale} onLocaleChange={() => router.refresh()}>
			{children}
		</BaseI18nProvider>
	);
}
