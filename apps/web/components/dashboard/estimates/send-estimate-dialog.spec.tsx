import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import "@/test/mocks";
import type { Estimate } from "@/lib/services/estimates";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithQuery } from "@/test/query";
import { SendEstimateDialog } from "./send-estimate-dialog";

const estimate = {
	id: "est-1",
	number: 3,
	status: "draft",
	sentTo: null,
} as Estimate;

const SEND_URL = apiUrl("/companies/fixr/estimates/est-1/send");

describe("SendEstimateDialog", () => {
	it("sends to the typed email and closes", async () => {
		let body: unknown;
		server.use(
			http.post(SEND_URL, async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(envelope({ ...estimate, status: "sent" }));
			})
		);
		const onOpenChange = vi.fn();

		renderWithQuery(
			<SendEstimateDialog
				estimate={estimate}
				onOpenChange={onOpenChange}
				open
			/>
		);
		await userEvent.type(
			screen.getByLabelText("Email do cliente"),
			"maria@fixr.test"
		);
		await userEvent.click(screen.getByRole("button", { name: /Enviar/ }));

		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
		expect(body).toEqual({ email: "maria@fixr.test" });
	});

	it("lets the API use the customer's email when left empty", async () => {
		let body: unknown;
		server.use(
			http.post(SEND_URL, async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(envelope(estimate));
			})
		);

		renderWithQuery(
			<SendEstimateDialog estimate={estimate} onOpenChange={vi.fn()} open />
		);
		await userEvent.click(screen.getByRole("button", { name: /Enviar/ }));

		await waitFor(() => expect(body).toEqual({}));
	});

	it("refuses an invalid email", async () => {
		renderWithQuery(
			<SendEstimateDialog estimate={estimate} onOpenChange={vi.fn()} open />
		);
		await userEvent.type(screen.getByLabelText("Email do cliente"), "maria");
		await userEvent.click(screen.getByRole("button", { name: /Enviar/ }));

		expect(await screen.findByText("Email inválido")).toBeInTheDocument();
	});
});
