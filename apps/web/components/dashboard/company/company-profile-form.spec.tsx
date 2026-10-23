import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Company } from "@/lib/services/company";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { render } from "@/test/render";
import { CompanyProfileForm } from "./company-profile-form";

const company: Company = {
	id: "ckx1y2z3a4b5c6d7e8f9g0h2",
	name: "Assistência Alfa",
	cnpj: "12345678000190",
	address: null,
	email: null,
	phone: "1134567890",
	website: null,
	logoUrl: null,
	subdomain: "fixr",
	createdAt: new Date(),
};

function renderForm() {
	render(
		<QueryClientProvider client={new QueryClient()}>
			<CompanyProfileForm company={company} />
		</QueryClientProvider>
	);
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CompanyProfileForm", () => {
	it("shows the stored data, with a read-only CNPJ", () => {
		renderForm();

		expect(screen.getByLabelText("Razão social")).toHaveValue(
			"Assistência Alfa"
		);
		expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 3456-7890");
		expect(screen.getByDisplayValue("12.345.678/0001-90")).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Salvar alterações" })
		).toBeDisabled();
	});

	it("saves the changed profile", async () => {
		let body: Record<string, unknown> = {};
		server.use(
			http.patch(apiUrl("/companies/fixr"), async ({ request }) => {
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(
					envelope(
						{ ...company, ...body },
						{ code: "update_company_profile_success" }
					)
				);
			})
		);
		const user = userEvent.setup();
		renderForm();

		await user.type(
			screen.getByLabelText("E-mail de contato"),
			"contato@alfa.dev"
		);
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(body).toMatchObject({
			name: "Assistência Alfa",
			email: "contato@alfa.dev",
		});
	});

	it("shows the API error", async () => {
		server.use(
			http.patch(apiUrl("/companies/fixr"), () =>
				HttpResponse.json(
					envelope(null, { status: 400, code: "company_logo_url_invalid" }),
					{ status: 400 }
				)
			)
		);
		const user = userEvent.setup();
		renderForm();

		await user.type(screen.getByLabelText("Site"), "https://alfa.dev");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: "Logo inválido" })
			)
		);
	});
});
