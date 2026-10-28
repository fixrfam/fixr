import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { router, toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithQuery } from "@/test/query";
import { PortalAccessForm } from "./portal-access-form";
import { PortalEntry } from "./portal-entry";
import { PortalHome } from "./portal-home";
import { PortalServiceOrder } from "./portal-service-order";

const summary = {
	id: "so-1",
	status: "waiting_approval",
	deviceMaker: "Apple",
	deviceModel: "iPhone 13",
	createdAt: "2026-10-01T12:00:00.000Z",
	updatedAt: "2026-10-02T12:00:00.000Z",
	company: { name: "Central Assistência", logoUrl: null },
	pendingEstimate: true,
};

const estimate = {
	id: "est-1",
	number: 4,
	status: "sent",
	discountPercentage: 0,
	validUntil: "2099-01-01T00:00:00.000Z",
	respondedAt: null,
	rejectionReason: null,
	expired: false,
	totals: { parts: 500, services: 0, subtotal: 500, discount: 0, total: 500 },
};

const detail = {
	...summary,
	reportedDefect: "Tela quebrada",
	company: {
		name: "Central Assistência",
		email: "contato@central.test",
		phone: "11987654321",
		website: null,
		address: "Rua A, 1",
		logoUrl: null,
	},
	items: [
		{
			type: "service",
			nested: false,
			name: "Troca de tela",
			quantity: 1,
			unitPrice: 150,
			total: 150,
		},
		{
			type: "part",
			nested: true,
			name: "Tela OLED",
			quantity: 1,
			unitPrice: 500,
			total: 500,
		},
	],
	estimates: [estimate],
};

const unauthorized = () =>
	HttpResponse.json(
		envelope(null, { status: 401, code: "portal_unauthorized" }),
		{ status: 401 }
	);

describe("PortalHome", () => {
	it("lists the customer's service orders across shops", async () => {
		server.use(
			http.get(apiUrl("/portal/service-orders"), () =>
				HttpResponse.json(
					envelope([
						summary,
						{
							...summary,
							id: "so-2",
							status: "delivered",
							pendingEstimate: false,
							company: { name: "Outra Loja", logoUrl: null },
						},
					])
				)
			),
			http.get(apiUrl("/portal/me"), () =>
				HttpResponse.json(
					envelope({ name: "Maria Oliveira", email: "m@x.test" })
				)
			)
		);

		renderWithQuery(<PortalHome />);

		expect(await screen.findByText("Olá, Maria!")).toBeInTheDocument();
		expect(screen.getAllByText("Apple iPhone 13")).toHaveLength(2);
		expect(screen.getByText(/Outra Loja/)).toBeInTheDocument();
		expect(screen.getByText("Aguardando sua aprovação")).toBeInTheDocument();
		expect(
			screen.getByText("Orçamento aguardando sua resposta")
		).toBeInTheDocument();
		expect(screen.getAllByRole("link")[0]).toHaveAttribute(
			"href",
			"/portal/service-orders/so-1"
		);
	});

	it("sends a visitor without a session to ask for a link", async () => {
		server.use(
			http.get(apiUrl("/portal/service-orders"), unauthorized),
			http.get(apiUrl("/portal/me"), unauthorized)
		);

		renderWithQuery(<PortalHome />);

		await waitFor(() =>
			expect(router.replace).toHaveBeenCalledWith("/portal/access")
		);
	});
});

describe("PortalEntry", () => {
	it("opens the session and goes to the portal", async () => {
		let body: unknown;
		server.use(
			http.post(apiUrl("/portal/session"), async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(envelope(null));
			})
		);

		renderWithQuery(<PortalEntry token={"t".repeat(43)} />);

		await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/portal"));
		expect(body).toEqual({ token: "t".repeat(43) });
	});

	it("offers a new link when the link is not valid", async () => {
		server.use(
			http.post(apiUrl("/portal/session"), () =>
				HttpResponse.json(
					envelope(null, { status: 404, code: "portal_link_invalid" }),
					{ status: 404 }
				)
			)
		);

		renderWithQuery(<PortalEntry token={"t".repeat(43)} />);

		expect(
			await screen.findByRole("link", { name: "Receber um novo link" })
		).toHaveAttribute("href", "/portal/access");
	});
});

describe("PortalServiceOrder", () => {
	it("shows the order and approves its estimate", async () => {
		let approved = false;
		server.use(
			http.get(apiUrl("/portal/service-orders/so-1"), () =>
				HttpResponse.json(envelope(detail))
			),
			http.post(apiUrl("/portal/estimates/est-1/approve"), () => {
				approved = true;
				return HttpResponse.json(
					envelope({
						...detail,
						status: "approved",
						estimates: [{ ...estimate, status: "approved" }],
					})
				);
			})
		);

		renderWithQuery(<PortalServiceOrder id="so-1" />);

		expect(
			await screen.findByRole("heading", { name: "Apple iPhone 13" })
		).toBeInTheDocument();
		expect(screen.getByText("Tela quebrada")).toBeInTheDocument();
		expect(screen.getByText(/\(11\) 98765-4321/)).toBeInTheDocument();
		// The part the service uses reads as part of it.
		expect(screen.getByText("Tela OLED").closest("tr")).toHaveTextContent(
			"Peça usada no serviço acima"
		);
		expect(screen.getByRole("link", { name: /Abrir PDF/ })).toHaveAttribute(
			"href",
			apiUrl("/portal/estimates/est-1/pdf")
		);

		await userEvent.click(screen.getByRole("button", { name: /Aprovar/ }));

		await waitFor(() => expect(approved).toBe(true));
		expect(await screen.findByText("Aprovada")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Aprovar/ })
		).not.toBeInTheDocument();
		expect(toast.success).toHaveBeenCalled();
	});
});

describe("PortalAccessForm", () => {
	it("asks for a link with the Turnstile token and confirms", async () => {
		let body: unknown;
		server.use(
			http.post(apiUrl("/portal/access"), async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(
					envelope(null, { status: 202, code: "portal_access_requested" }),
					{ status: 202 }
				);
			})
		);

		renderWithQuery(<PortalAccessForm />);
		await userEvent.type(screen.getByLabelText("Email"), "maria@fixr.test");
		await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));

		expect(await screen.findByText("Confira seu email")).toBeInTheDocument();
		expect(body).toEqual({
			email: "maria@fixr.test",
			cfTurnstileToken: "turnstile-test-token",
		});
	});
});
