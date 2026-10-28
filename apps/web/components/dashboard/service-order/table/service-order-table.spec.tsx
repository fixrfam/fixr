import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { router } from "@/test/mocks";
import { serveRepairs, serviceOrder } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { ServiceOrdersTable } from "./service-order-table";

let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

afterEach(() => {
	vi.clearAllMocks();
});

const bodyRows = async () => {
	await screen.findByText(serviceOrder.client.name);
	const [, body] = screen.getAllByRole("rowgroup");
	return within(body!).getAllByRole("row");
};

describe("ServiceOrdersTable", () => {
	it("lists the API's orders with the device, customer and status", async () => {
		render(<ServiceOrdersTable subdomain="fixr" />);

		const [row] = await bodyRows();
		expect(row).toHaveTextContent("FIXR-12");
		expect(row).toHaveTextContent(serviceOrder.model.name);
		expect(row).toHaveTextContent("Em reparo");
		expect(api.listQueries[0]?.params).toMatchObject({
			page: "1",
			sort: "newer",
		});
	});

	it("sends the search to the API", async () => {
		const user = userEvent.setup();
		render(<ServiceOrdersTable subdomain="fixr" />);
		await bodyRows();

		await user.type(
			screen.getByPlaceholderText(/Busque por cliente/),
			"iphone"
		);

		await waitFor(() =>
			expect(api.listQueries.at(-1)?.params.query).toBe("iphone")
		);
	});

	it("opens the order detail when a row is clicked", async () => {
		const user = userEvent.setup();
		render(<ServiceOrdersTable subdomain="fixr" />);

		await user.click((await bodyRows())[0]!);

		expect(router.push).toHaveBeenCalledWith(
			`/dashboard/fixr/service-orders/${serviceOrder.id}`
		);
	});

	it("hides the create button from roles that can't open orders", async () => {
		render(<ServiceOrdersTable subdomain="fixr" />, { role: "technician" });
		await bodyRows();

		expect(
			screen.queryByRole("link", { name: /Nova ordem de serviço/ })
		).not.toBeInTheDocument();
	});
});
