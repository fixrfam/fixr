// @vitest-environment jsdom
import {
	act,
	cleanup,
	render,
	renderHook,
	screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_COOKIE } from "./config";
import {
	I18nProvider,
	useFormatter,
	useLocale,
	useMessage,
	useTranslation,
} from "./react";

afterEach(() => {
	cleanup();
	document.cookie = `${LOCALE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
});

function SaveButton() {
	const { t, setLocale } = useTranslation();

	return (
		<>
			<button type="button">{t("common.actions.save")}</button>
			<button onClick={() => setLocale("en")} type="button">
				switch
			</button>
		</>
	);
}

const withLocale =
	(locale: "en" | "pt-BR") =>
	({ children }: { children: ReactNode }) => (
		<I18nProvider locale={locale}>{children}</I18nProvider>
	);

describe("I18nProvider", () => {
	it("renders the tree in the locale resolved on the server", () => {
		render(
			<I18nProvider locale="pt-BR">
				<SaveButton />
			</I18nProvider>
		);

		expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
	});

	it("switches language, remembers it and notifies the app", async () => {
		const onLocaleChange = vi.fn();
		render(
			<I18nProvider locale="pt-BR" onLocaleChange={onLocaleChange}>
				<SaveButton />
			</I18nProvider>
		);

		await act(async () => {
			screen.getByRole("button", { name: "switch" }).click();
		});

		expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
		expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
		expect(onLocaleChange).toHaveBeenCalledWith("en");
	});

	it("follows the server when it resolves another locale", () => {
		const { rerender } = render(
			<I18nProvider locale="en">
				<SaveButton />
			</I18nProvider>
		);

		rerender(
			<I18nProvider locale="pt-BR">
				<SaveButton />
			</I18nProvider>
		);

		expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
	});
});

describe("outside a provider", () => {
	it("still translates, in the default locale", () => {
		const { result } = renderHook(() => useTranslation());

		expect(result.current.locale).toBe("en");
		expect(result.current.t("common.actions.save")).toBe("Save");
	});

	it("still remembers a language picked by hand", () => {
		const { result } = renderHook(() => useTranslation());

		result.current.setLocale("pt-BR");

		expect(document.cookie).toContain(`${LOCALE_COOKIE}=pt-BR`);
	});
});

describe("hooks", () => {
	it("useLocale returns the active locale", () => {
		const { result } = renderHook(() => useLocale(), {
			wrapper: withLocale("pt-BR"),
		});

		expect(result.current).toBe("pt-BR");
	});

	it("useMessage turns an API code into copy in the active locale", () => {
		const { result } = renderHook(() => useMessage(), {
			wrapper: withLocale("pt-BR"),
		});
		const { result: english } = renderHook(() => useMessage(), {
			wrapper: withLocale("en"),
		});

		const message = result.current("subdomain_taken");

		expect(message.title).toBeTruthy();
		expect(message.title).not.toBe(english.current("subdomain_taken").title);
		expect(result.current(undefined, "success").title).toBeTruthy();
	});

	it("useFormatter formats in the active locale", () => {
		const { result } = renderHook(() => useFormatter(), {
			wrapper: withLocale("pt-BR"),
		});

		expect(result.current.number(1234.5)).toBe("1.234,5");
	});
});
