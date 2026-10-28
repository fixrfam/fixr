import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { router, toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithQuery } from "@/test/query";
import { PublicEstimate } from "./public-estimate";

const TOKEN = "t".repeat(43);
const LINK = apiUrl(`/estimate-links/${TOKEN}`);

const estimate = {
	number: 7,
	status: "sent",
	validUntil: "2099-01-31T00:00:00.000Z",
	expired: false,
	discountPercentage: 10,
	notes: "Garantia de 90 dias",
	sentAt: "2026-10-20T12:00:00.000Z",
	respondedAt: null,
	rejectionReason: null,
	company: {
		name: "Central Assistência",
		email: null,
		phone: null,
		website: null,
		logoUrl: null,
	},
	client: { name: "Maria" },
	device: {
		maker: "Apple",
		model: "iPhone 13",
		reportedDefect: "Tela quebrada",
	},
	items: [
		{
			type: "service",
			nested: false,
			name: "Troca de tela",
			quantity: 1,
			unitPrice: 0,
			total: 0,
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
	totals: { parts: 500, services: 0, subtotal: 500, discount: 50, total: 450 },
};

function serve(data: unknown = estimate) {
	server.use(http.get(LINK, () => HttpResponse.json(envelope(data))));
}

describe("PublicEstimate", () => {
	it("shows the estimate with its items and totals", async () => {
		serve();

		renderWithQuery(<PublicEstimate token={TOKEN} />);

		expect(
			await screen.findByRole("heading", { name: "Orçamento #0007" })
		).toBeInTheDocument();
		expect(
			screen.getByText("Emitido por Central Assistência")
		).toBeInTheDocument();
		expect(screen.getByText("Tela OLED").closest("tr")).toHaveTextContent(
			"Peça usada no serviço acima"
		);
		expect(screen.getByText("Garantia de 90 dias")).toBeInTheDocument();
		expect(screen.getByText(/450,00/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Baixar PDF/ })).toHaveAttribute(
			"href",
			`${LINK}/pdf`
		);
	});

	it("approves the estimate", async () => {
		serve();
		let approved = false;
		server.use(
			http.post(`${LINK}/approve`, () => {
				approved = true;
				return HttpResponse.json(
					envelope(
						{
							...estimate,
							status: "approved",
							respondedAt: "2026-10-21T12:00:00.000Z",
						},
						{ code: "approve_estimate_success" }
					)
				);
			})
		);

		renderWithQuery(<PublicEstimate token={TOKEN} />);
		await userEvent.click(
			await screen.findByRole("button", { name: /Aprovar orçamento/ })
		);

		await waitFor(() => expect(approved).toBe(true));
		expect(
			await screen.findByText(/Você aprovou este orçamento/)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Aprovar orçamento/ })
		).not.toBeInTheDocument();
		expect(toast.success).toHaveBeenCalled();
	});

	it("rejects with the reason typed by the client", async () => {
		serve();
		let body: unknown;
		server.use(
			http.post(`${LINK}/reject`, async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(
					envelope(
						{
							...estimate,
							status: "rejected",
							respondedAt: "2026-10-21T12:00:00.000Z",
						},
						{ code: "reject_estimate_success" }
					)
				);
			})
		);

		renderWithQuery(<PublicEstimate token={TOKEN} />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Recusar" })
		);
		await userEvent.type(
			screen.getByLabelText("Motivo (opcional)"),
			"Ficou caro"
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Recusar orçamento" })
		);

		await waitFor(() => expect(body).toEqual({ reason: "Ficou caro" }));
		expect(
			await screen.findByText(/Você recusou este orçamento/)
		).toBeInTheDocument();
	});

	it("hides the answer buttons on an expired estimate", async () => {
		serve({ ...estimate, expired: true });

		renderWithQuery(<PublicEstimate token={TOKEN} />);

		expect(
			await screen.findByText(/Este orçamento venceu/)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Aprovar orçamento/ })
		).not.toBeInTheDocument();
	});

	it("explains when the link is no longer valid", async () => {
		server.use(
			http.get(LINK, () =>
				HttpResponse.json(
					envelope(null, { status: 404, code: "estimate_link_invalid" }),
					{ status: 404 }
				)
			)
		);

		renderWithQuery(<PublicEstimate token={TOKEN} />);

		expect(
			await screen.findByRole("heading", { name: "Orçamento indisponível" })
		).toBeInTheDocument();
	});

	it("goes to the client's portal from the estimate", async () => {
		serve();
		let body: unknown;
		server.use(
			http.post(apiUrl("/portal/session/estimate"), async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(envelope(null));
			})
		);

		renderWithQuery(<PublicEstimate token={TOKEN} />);
		await userEvent.click(
			await screen.findByRole("button", {
				name: /Ver todas as minhas ordens de serviço/,
			})
		);

		await waitFor(() => expect(router.push).toHaveBeenCalledWith("/portal"));
		expect(body).toEqual({ token: TOKEN });
	});
});
