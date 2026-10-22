import type { Locale } from "@fixr/i18n";
import { I18nProvider } from "@fixr/i18n/react";
import {
	type RenderOptions,
	render as rtlRender,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

interface I18nRenderOptions extends Omit<RenderOptions, "wrapper"> {
	/** Language the tree renders in. Specs assert on pt-BR copy by default. */
	locale?: Locale;
}

/** `render` from Testing Library, inside the i18n provider every page has. */
export function render(
	ui: ReactElement,
	{ locale = "pt-BR", ...options }: I18nRenderOptions = {}
) {
	function Wrapper({ children }: { children: ReactNode }) {
		return <I18nProvider locale={locale}>{children}</I18nProvider>;
	}

	return rtlRender(ui, { wrapper: Wrapper, ...options });
}
