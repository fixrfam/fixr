import { mockParts } from "@fixr/mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { SessionProvider } from "@/lib/hooks/use-session";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { serveInventory } from "@/test/msw/inventory";
import { server } from "@/test/msw/server";
import { render } from "@/test/render";
import { ServiceOrderItems } from "./service-order-items";

const ITEMS_URL = apiUrl("/companies/fixr/service-orders/so-1/items");

const screenItem = {
	id: "item-1",
	serviceOrderId: "so-1",
	type: "part",
	partId: mockParts[0]!.id,
	serviceId: null,
	name: "Tela OLED iPhone 13",
	quantity: 1,
	unitPrice: 890,
	total: 890,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const withItems = (items: unknown[], total: number) =>
	envelope({ items, totals: { parts: total, services: 0, total } });

function renderWidget(role = "manager") {
	render(
		<QueryClientProvider
			client={
				new QueryClient({ defaultOptions: { queries: { retry: false } } })
			}
		>
			<SessionProvider
				session={
					{
						id: "u1",
						email: "a@fixr.test",
						displayName: "A",
						avatarUrl: null,
						profileType: "employee",
						company: { id: "c1", name: "Fixr", subdomain: "fixr", role },
						createdAt: new Date(),
						iat: 1,
						exp: 9_999_999_999,
					} as never
				}
			>
				<ServiceOrderItems serviceOrderId="so-1" />
			</SessionProvider>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
	serveInventory();
});

describe("ServiceOrderItems", () => {
	it("shows the items and the order total", async () => {
		server.use(
			http.get(ITEMS_URL, () => HttpResponse.json(withItems([screenItem], 890)))
		);

		renderWidget();

		expect(await screen.findByText("Tela OLED iPhone 13")).toBeInTheDocument();
		const total = screen.getByText("Total").closest("div")!;
		expect(within(total).getByText(/890,00/)).toBeInTheDocument();
	});

	it("adds a catalog part", async () => {
		let body: unknown;
		server.use(
			http.get(ITEMS_URL, () => HttpResponse.json(withItems([], 0))),
			http.post(ITEMS_URL, async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(withItems([screenItem], 890), { status: 201 });
			})
		);
		const user = userEvent.setup();
		renderWidget();

		await user.click(
			await screen.findByRole("button", { name: /Adicionar item/ })
		);
		await user.click(await screen.findByText(mockParts[0]!.name));

		await waitFor(() =>
			expect(body).toEqual({ type: "part", itemId: mockParts[0]!.id })
		);
		expect(await screen.findByText("Tela OLED iPhone 13")).toBeInTheDocument();
	});

	it("removes an item", async () => {
		server.use(
			http.get(ITEMS_URL, () =>
				HttpResponse.json(withItems([screenItem], 890))
			),
			http.delete(`${ITEMS_URL}/item-1`, () =>
				HttpResponse.json(withItems([], 0))
			)
		);
		const user = userEvent.setup();
		renderWidget();

		await user.click(
			await screen.findByRole("button", {
				name: "Remover Tela OLED iPhone 13",
			})
		);

		expect(
			await screen.findByText("Nenhuma peça ou serviço ainda.")
		).toBeInTheDocument();
	});

	it("is read-only without permission to update the order", async () => {
		server.use(
			http.get(ITEMS_URL, () => HttpResponse.json(withItems([screenItem], 890)))
		);

		renderWidget("guest");

		expect(await screen.findByText("Tela OLED iPhone 13")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Adicionar item/ })
		).not.toBeInTheDocument();
	});

	it("explains when the order is not saved in the system", async () => {
		server.use(
			http.get(ITEMS_URL, () =>
				HttpResponse.json(
					envelope(null, { status: 404, code: "service_order_not_found" }),
					{ status: 404 }
				)
			)
		);

		renderWidget();

		expect(
			await screen.findByText(
				/só ficam disponíveis para ordens de serviço salvas/
			)
		).toBeInTheDocument();
	});
});
