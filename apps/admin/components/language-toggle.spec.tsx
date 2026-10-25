import { createTranslator, LOCALE_COOKIE, localeNames } from "@fixr/i18n";
import { useTranslation } from "@fixr/i18n/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "./i18n-provider";
import { LanguageToggle } from "./language-toggle";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
	vi.clearAllMocks();
	document.cookie = `${LOCALE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
});

function SaveLabel() {
	const { t } = useTranslation();
	return <p>{t("common.actions.save")}</p>;
}

function renderToggle() {
	render(
		<I18nProvider locale="pt-BR">
			<LanguageToggle />
			<SaveLabel />
		</I18nProvider>
	);
}

describe("LanguageToggle", () => {
	it("is labelled in the active language", () => {
		renderToggle();

		expect(
			screen.getByRole("button", {
				name: createTranslator("pt-BR").t("common.language.change"),
			})
		).toBeInTheDocument();
	});

	it("offers every locale by its own name", async () => {
		const user = userEvent.setup();
		renderToggle();

		await user.click(screen.getByRole("button"));

		const items = await screen.findAllByRole("menuitem");
		expect(items.map((item) => item.textContent)).toEqual(
			Object.values(localeNames)
		);
	});

	it("switches language, remembers it and refreshes server content", async () => {
		const user = userEvent.setup();
		renderToggle();
		expect(screen.getByText("Salvar")).toBeInTheDocument();

		await user.click(screen.getByRole("button"));
		await user.click(
			await screen.findByRole("menuitem", { name: localeNames.en })
		);

		expect(await screen.findByText("Save")).toBeInTheDocument();
		expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
		expect(router.refresh).toHaveBeenCalledTimes(1);
	});
});
