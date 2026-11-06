import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Estimate } from "@/lib/services/estimates";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { router } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { customer, serveRepairs } from "@/test/msw/repairs";
import { server } from "@/test/msw/server";
import { renderWithQuery as render } from "@/test/query";
import { EstimatesTable } from "./estimates-table";

const estimate: Estimate = {
	id: "cestimate0000000000000001",
	serviceOrderId: "cserviceorder00000000001",
	number: 7,
	status: "sent",
	discountPercentage: 10,
	validUntil: "2099-01-01T12:00:00.000Z",
	notes: null,
	sentTo: null,
	sentAt: null,
	respondedAt: null,
	rejectionReason: null,
	createdAt: "2026-10-20T12:00:00.000Z",
	updatedAt: "2026-10-20T12:00:00.000Z",
	client: {
		id: customer.id,
		name: customer.name,
		phone: customer.phone,
		email: customer.email,
	},
	serviceOrder: {
		id: "cserviceorder00000000001",
		number: 12,
		status: "in_repair",
	},
	device: {
		model: { id: "m1", name: "iPhone 13", slug: "iphone-13", imageUrl: null },
		maker: "Apple",
		category: "smartphone",
	},
	itemsCount: 3,
	totals: {
		parts: 900,
		services: 150,
		subtotal: 1050,
		discount: 105,
		total: 945,
	},
};

let queries: Record<string, string>[];

beforeEach(() => {
	setSessionCookie(fakeJwt());
	serveRepairs();
	queries = [];
	server.use(
		http.get(apiUrl("/companies/fixr/estimates"), ({ request }) => {
			queries.push(Object.fromEntries(new URL(request.url).searchParams));
			return HttpResponse.json(
				envelope({
					records: [estimate],
					pagination: {
						total_records: 1,
						total_pages: 1,
						current_page: 1,
						next_page: null,
						prev_page: null,
					},
				})
			);
		})
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

async function firstRow() {
	await screen.findByText("#0007");
	const [, body] = screen.getAllByRole("rowgroup");
	return within(body!).getAllByRole("row")[0]!;
}

describe("EstimatesTable", () => {
	it("shows the client, the source order, the items and the total at a glance", async () => {
		render(<EstimatesTable />);

		const row = await firstRow();
		expect(row).toHaveTextContent(customer.name);
		expect(row).toHaveTextContent("FIXR-12");
		expect(row).toHaveTextContent("iPhone 13");
		expect(row).toHaveTextContent("3 itens");
		expect(row).toHaveTextContent("10% de desconto");
		expect(
			within(row).getByRole("link", { name: new RegExp(customer.name) })
		).toHaveAttribute("href", `/dashboard/fixr/customers/${customer.id}`);
	});

	it("searches by number and filters by a searched client", async () => {
		const user = userEvent.setup();
		render(<EstimatesTable />);
		await firstRow();

		await user.type(screen.getByPlaceholderText(/Buscar por número/), "7");
		await waitFor(() => expect(queries.at(-1)?.query).toBe("7"));

		await user.click(screen.getByRole("combobox", { name: "Cliente" }));
		await user.click(await screen.findByRole("option", { name: /Maria/ }));
		await waitFor(() => expect(queries.at(-1)?.clientId).toBe(customer.id));
	});

	it("opens the estimate when a row is clicked", async () => {
		const user = userEvent.setup();
		render(<EstimatesTable />);

		await user.click(await firstRow());

		expect(router.push).toHaveBeenCalledWith(
			`/dashboard/fixr/estimates/${estimate.id}`
		);
	});
});
