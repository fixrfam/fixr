import { mockServiceOrders } from "@fixr/mock";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/mocks";
import { ServiceOrdersTable } from "./service-order-table";

// NOTE: the table still renders @fixr/mock data; it is not wired to the API yet (#95 findings).

const bodyRows = () => {
	const [, body] = screen.getAllByRole("rowgroup");
	return within(body!).getAllByRole("row");
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("ServiceOrdersTable", () => {
	it("renders the first page of 10 orders", () => {
		render(<ServiceOrdersTable subdomain="fixr" />);

		expect(bodyRows()).toHaveLength(Math.min(10, mockServiceOrders.length));
	});

	it("filters by the search box and clears it", async () => {
		const user = userEvent.setup();
		const target = mockServiceOrders[0]!;
		render(<ServiceOrdersTable subdomain="fixr" />);

		await user.type(
			screen.getByPlaceholderText(
				"Busque por ordem, cliente, aparelho ou status..."
			),
			target.orderNumber
		);

		const rows = bodyRows();
		expect(rows.length).toBeGreaterThanOrEqual(1);
		expect(rows[0]).toHaveTextContent(target.orderNumber);

		await user.click(screen.getByRole("button", { name: /limpar/i }));
		expect(bodyRows()).toHaveLength(Math.min(10, mockServiceOrders.length));
	});

	it("shows an empty state when nothing matches", async () => {
		const user = userEvent.setup();
		render(<ServiceOrdersTable subdomain="fixr" />);

		await user.type(
			screen.getByPlaceholderText(
				"Busque por ordem, cliente, aparelho ou status..."
			),
			"zzz-no-match-zzz"
		);

		expect(bodyRows()).toHaveLength(1);
		expect(bodyRows()[0]).toHaveTextContent(
			/nenhum|no results|sem resultados/i
		);
	});

	it("opens the order detail when a row is clicked", async () => {
		const user = userEvent.setup();
		render(<ServiceOrdersTable subdomain="fixr" />);

		await user.click(bodyRows()[0]!);

		expect(router.push).toHaveBeenCalledWith(
			expect.stringMatching(/^\/dashboard\/fixr\/service-orders\/.+/)
		);
	});
});
