import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { router, toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithQuery } from "@/test/query";
import { EstimateEntry } from "./estimate-entry";
import { PortalAccessForm } from "./portal-access-form";
import { PortalEntry } from "./portal-entry";
import { PortalEstimate } from "./portal-estimates";
import { PortalHome } from "./portal-home";
import { PortalServiceOrder } from "./portal-service-order";
import { PortalShell } from "./portal-shell";

const company = { name: "Central Assistência", logoUrl: null };

const summary = {
	id: "so-1",
	code: "CENTRAL-12",
	status: "waiting_approval",
	deviceMaker: "Apple",
	deviceModel: "iPhone 13",
	deviceCategory: "smartphone",
	deviceImageUrl: null,
	createdAt: "2026-10-01T12:00:00.000Z",
	updatedAt: "2026-10-02T12:00:00.000Z",
	company,
	pendingEstimate: true,
};

const estimateSummary = {
	id: "est-1",
	number: 4,
	status: "sent",
	validUntil: "2099-01-01T00:00:00.000Z",
	sentAt: "2026-10-02T12:00:00.000Z",
	respondedAt: null,
	expired: false,
	serviceOrderId: "so-1",
	serviceOrderCode: "CENTRAL-12",
	company,
	deviceMaker: "Apple",
	deviceModel: "iPhone 13",
	deviceCategory: "smartphone",
	deviceImageUrl: null,
	totals: { parts: 500, services: 150, subtotal: 650, discount: 0, total: 650 },
};

const items = [
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
];

const detail = {
	...summary,
	reportedDefect: "Tela quebrada",
	history: [
		{ status: "pending", at: "2026-10-01T12:00:00.000Z" },
		{ status: "waiting_approval", at: "2026-10-02T12:00:00.000Z" },
	],
	company: {
		...company,
		email: "contato@central.test",
		phone: "11987654321",
		website: null,
		address: "Rua A, 1",
	},
	items,
	estimates: [
		{
			id: "est-1",
			number: 4,
			status: "sent",
			discountPercentage: 0,
			validUntil: "2099-01-01T00:00:00.000Z",
			respondedAt: null,
			rejectionReason: null,
			expired: false,
			totals: estimateSummary.totals,
		},
	],
};

const estimateView = {
	id: "est-1",
	serviceOrderId: "so-1",
	number: 4,
	status: "sent",
	validUntil: "2099-01-01T00:00:00.000Z",
	expired: false,
	discountPercentage: 0,
	notes: null,
	sentAt: "2026-10-02T12:00:00.000Z",
	respondedAt: null,
	rejectionReason: null,
	company: { ...detail.company },
	client: { name: "Maria" },
	serviceOrder: {
		code: "CENTRAL-12",
		status: "waiting_approval",
		openedAt: "2026-10-01T12:00:00.000Z",
	},
	device: {
		maker: "Apple",
		model: "iPhone 13",
		category: "smartphone",
		imageUrl: null,
		reportedDefect: "Tela quebrada",
	},
	items,
	totals: estimateSummary.totals,
};

const me = {
	name: "Maria Oliveira",
	email: "maria@fixr.test",
	cpf: "52998224725",
	shops: [{ ...detail.company }],
};

const unauthorized = () =>
	HttpResponse.json(
		envelope(null, { status: 401, code: "portal_unauthorized" }),
		{ status: 401 }
	);

function servePortal() {
	server.use(
		http.get(apiUrl("/portal/me"), () => HttpResponse.json(envelope(me))),
		http.get(apiUrl("/portal/service-orders"), () =>
			HttpResponse.json(envelope([summary]))
		),
		http.get(apiUrl("/portal/estimates"), () =>
			HttpResponse.json(envelope([estimateSummary]))
		)
	);
}

describe("PortalShell", () => {
	it("greets the client and shows the pending estimates on the bottom nav", async () => {
		servePortal();

		renderWithQuery(
			<PortalShell>
				<p>conteúdo</p>
			</PortalShell>
		);

		expect(await screen.findByText("Olá, Maria")).toBeInTheDocument();
		const nav = screen.getByRole("navigation", { name: "Navegação do portal" });
		expect(
			within(nav).getByRole("link", { name: /Orçamentos/ })
		).toHaveTextContent("1");
		expect(
			screen.getByRole("link", { name: "Abrir seu perfil" })
		).toHaveAttribute("href", "/portal/profile");
	});

	it("sends a visitor without a session to ask for a link", async () => {
		server.use(http.get(apiUrl("/portal/me"), unauthorized));

		renderWithQuery(
			<PortalShell>
				<p>conteúdo</p>
			</PortalShell>
		);

		await waitFor(() =>
			expect(router.replace).toHaveBeenCalledWith("/portal/access")
		);
	});
});

describe("PortalHome", () => {
	it("puts the estimate waiting for an answer first, then the repairs", async () => {
		servePortal();

		renderWithQuery(<PortalHome />);

		expect(
			await screen.findByText("Aguardando sua resposta")
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Ver orçamento/ })).toHaveAttribute(
			"href",
			"/portal/estimates/est-1"
		);
		expect(
			screen.getByRole("heading", { name: "Em andamento" })
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("link", { name: /iPhone 13/ }).at(-1)
		).toHaveAttribute("href", "/portal/service-orders/so-1");
	});
});

describe("PortalEntry", () => {
	it("opens the session from the magic link and goes to the portal", async () => {
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

describe("EstimateEntry", () => {
	it("signs the client in from the estimate email and lands on the estimate", async () => {
		server.use(
			http.post(apiUrl("/portal/session/estimate"), () =>
				HttpResponse.json(envelope({ estimateId: "est-1" }))
			)
		);

		renderWithQuery(<EstimateEntry token={"e".repeat(43)} />);

		await waitFor(() =>
			expect(router.replace).toHaveBeenCalledWith("/portal/estimates/est-1")
		);
	});
});

describe("PortalServiceOrder", () => {
	it("shows the device, the progress, the items and the estimates", async () => {
		server.use(
			http.get(apiUrl("/portal/service-orders/so-1"), () =>
				HttpResponse.json(envelope(detail))
			)
		);

		renderWithQuery(<PortalServiceOrder id="so-1" />);

		expect(await screen.findByText("Tela quebrada")).toBeInTheDocument();
		expect(
			screen.getAllByText("Aguardando sua aprovação").length
		).toBeGreaterThan(0);
		expect(screen.getByText("Tela OLED").closest("li")).toHaveTextContent(
			"Peça usada no serviço acima"
		);
		expect(
			screen.getByRole("link", { name: /Orçamento #0004/ })
		).toHaveAttribute("href", "/portal/estimates/est-1");
		expect(screen.getByRole("link", { name: /Ligar/ })).toHaveAttribute(
			"href",
			"tel:11987654321"
		);
	});
});

describe("PortalEstimate", () => {
	it("shows the estimate with its PDF and approves it", async () => {
		let approved = false;
		server.use(
			http.get(apiUrl("/portal/estimates/est-1"), () =>
				HttpResponse.json(envelope(estimateView))
			),
			http.post(apiUrl("/portal/estimates/est-1/approve"), () => {
				approved = true;
				return HttpResponse.json(
					envelope(
						{
							...estimateView,
							status: "approved",
							respondedAt: "2026-10-03T12:00:00.000Z",
						},
						{ code: "approve_estimate_success" }
					)
				);
			})
		);

		renderWithQuery(<PortalEstimate id="est-1" />);

		expect(await screen.findByText("CENTRAL-12")).toBeInTheDocument();
		expect(screen.getByTitle("PDF do orçamento #0004")).toHaveAttribute(
			"src",
			`${apiUrl("/portal/estimates/est-1/pdf")}#view=FitH`
		);

		await userEvent.click(
			screen.getByRole("button", { name: /Aprovar orçamento/ })
		);

		await waitFor(() => expect(approved).toBe(true));
		expect(
			await screen.findByText(/Você aprovou este orçamento/)
		).toBeInTheDocument();
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
		await userEvent.click(
			screen.getByRole("button", { name: "Receber o link" })
		);

		expect(await screen.findByText("Confira seu email")).toBeInTheDocument();
		expect(body).toEqual({
			email: "maria@fixr.test",
			cfTurnstileToken: "turnstile-test-token",
		});
	});
});
