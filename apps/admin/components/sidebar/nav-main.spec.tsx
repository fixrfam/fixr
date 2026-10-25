import { createTranslator } from "@fixr/i18n";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { render } from "@/test/render";
import { NavMain } from "./nav-main";

const { t } = createTranslator("pt-BR");

const items = [
	{
		titleKey: "admin.nav.companies",
		url: "/dash/companies",
		isActive: true,
		items: [
			{ titleKey: "admin.nav.list", url: "/dash/companies" },
			{ titleKey: "admin.nav.new", url: "/dash/companies/new" },
		],
	},
] as const;

function renderNav(isActive = true) {
	render(
		<SidebarProvider>
			<NavMain items={[{ ...items[0], isActive }]} />
		</SidebarProvider>
	);
}

describe("NavMain", () => {
	it("translates the group and its links", () => {
		renderNav();

		expect(screen.getByText(t("admin.nav.platform"))).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: t("admin.nav.new") })
		).toHaveAttribute("href", "/dash/companies/new");
	});

	it("starts an inactive section collapsed and opens it on click", async () => {
		const user = userEvent.setup();
		renderNav(false);

		expect(
			screen.queryByRole("link", { name: t("admin.nav.list") })
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: t("admin.nav.companies") })
		);

		expect(
			await screen.findByRole("link", { name: t("admin.nav.list") })
		).toBeInTheDocument();
	});
});
