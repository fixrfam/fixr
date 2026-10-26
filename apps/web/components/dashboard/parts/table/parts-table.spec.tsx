import { createTranslator } from "@fixr/i18n";
import { mockParts } from "@fixr/mock";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { serveInventory } from "@/test/msw/inventory";
import { renderWithQuery as render } from "@/test/query";
import { PartsTable } from "./parts-table";

vi.mock("@/lib/hooks/use-media-query", () => ({ useMediaQuery: () => true }));

const { t } = createTranslator("pt-BR");

let api: ReturnType<typeof serveInventory>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveInventory();
});

const lastPartsQuery = () =>
	api.listQueries.filter((q) => q.path === "/companies/fixr/parts").at(-1)
		?.params;

describe("PartsTable", () => {
	it("loads the page in the URL, not the whole catalog", async () => {
		render(<PartsTable />, { searchParams: "?page=2&perPage=5" });

		await waitFor(() =>
			expect(lastPartsQuery()).toEqual({
				page: "2",
				perPage: "5",
				sort: "name",
			})
		);
		const second = [...mockParts]
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(5, 10);
		expect(await screen.findByText(second[0]!.name)).toBeInTheDocument();
	});

	it("searches on the API once the user pauses, back on page one", async () => {
		const user = userEvent.setup();
		render(<PartsTable />, { searchParams: "?page=2&perPage=5" });
		await waitFor(() => expect(lastPartsQuery()?.page).toBe("2"));

		await user.type(
			screen.getByPlaceholderText(t("parts.table.search")),
			"bat"
		);

		await waitFor(() =>
			expect(lastPartsQuery()).toEqual({
				page: "1",
				perPage: "5",
				query: "bat",
				sort: "name",
			})
		);
		// Debounced: no request per keystroke.
		expect(
			api.listQueries.filter((q) => q.params.query?.startsWith("b"))
		).toHaveLength(1);
	});

	it("filters by category and low stock through the API", async () => {
		const user = userEvent.setup();
		render(<PartsTable />);
		await waitFor(() => expect(lastPartsQuery()).toBeDefined());

		const filters = within(
			screen.getByRole("group", { name: t("dataTable.filters.title") })
		);
		await user.click(
			filters.getByRole("button", { name: t("parts.table.headers.category") })
		);
		await user.click(await screen.findByRole("option", { name: "Baterias" }));
		await user.click(
			filters.getByRole("button", { name: t("parts.table.lowStockFilter") })
		);

		await waitFor(() =>
			expect(lastPartsQuery()).toEqual({
				page: "1",
				perPage: "10",
				sort: "name",
				category: "Baterias",
				lowStock: "true",
			})
		);
	});
});
