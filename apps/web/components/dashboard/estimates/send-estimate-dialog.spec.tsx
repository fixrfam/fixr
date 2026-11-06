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

const customer = {
	id: "ccustomer000000000000000001",
	name: "Maria Oliveira",
	phone: null,
	email: "maria@cliente.test",
};
const estimate = {
	id: "est-1",
	number: 3,
	status: "draft",
	sentTo: null,
	customer,
} as Estimate;

const SEND_URL = apiUrl("/companies/fixr/estimates/est-1/send");

function serveSend() {
	const bodies: unknown[] = [];
	server.use(
		http.post(SEND_URL, async ({ request }) => {
			bodies.push(await request.json());
			return HttpResponse.json(envelope({ ...estimate, status: "sent" }));
		})
	);
	return bodies;
}

describe("SendEstimateDialog", () => {
	it("sends to the email on the customer's profile without asking for it", async () => {
		const bodies = serveSend();
		const onOpenChange = vi.fn();

		renderWithQuery(
			<SendEstimateDialog
				estimate={estimate}
				onOpenChange={onOpenChange}
				open
			/>
		);
		expect(screen.getByText(customer.email)).toBeInTheDocument();
		expect(screen.queryByLabelText("Email do cliente")).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: /^Enviar$/ }));

		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
		expect(bodies).toEqual([{}]);
	});

	it("sends to another email when asked", async () => {
		const bodies = serveSend();

		renderWithQuery(
			<SendEstimateDialog estimate={estimate} onOpenChange={vi.fn()} open />
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Enviar para outro email" })
		);
		await userEvent.type(
			screen.getByLabelText("Email do cliente"),
			"outro@fixr.test"
		);
		await userEvent.click(screen.getByRole("button", { name: /^Enviar$/ }));

		await waitFor(() => expect(bodies).toEqual([{ email: "outro@fixr.test" }]));
	});

	it("asks for an email when the profile has none", async () => {
		const bodies = serveSend();

		renderWithQuery(
			<SendEstimateDialog
				estimate={{ ...estimate, customer: { ...customer, email: null } }}
				onOpenChange={vi.fn()}
				open
			/>
		);
		await userEvent.click(screen.getByRole("button", { name: /^Enviar$/ }));

		expect(
			await screen.findAllByText(/não tem email no cadastro/)
		).not.toHaveLength(0);
		expect(bodies).toEqual([]);
	});

	it("refuses an invalid email", async () => {
		renderWithQuery(
			<SendEstimateDialog
				estimate={{ ...estimate, customer: { ...customer, email: null } }}
				onOpenChange={vi.fn()}
				open
			/>
		);
		await userEvent.type(screen.getByLabelText("Email do cliente"), "maria");
		await userEvent.click(screen.getByRole("button", { name: /^Enviar$/ }));

		expect(await screen.findByText("Email inválido")).toBeInTheDocument();
	});
});
