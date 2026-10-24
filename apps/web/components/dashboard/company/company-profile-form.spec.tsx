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
import {
	CompanyProfileForm,
	CompanyProfileFormSkeleton,
} from "./company-profile-form";

// jsdom has no matchMedia: the logo dialog renders its desktop version.
vi.mock("@/lib/hooks/use-media-query", () => ({ useMediaQuery: () => true }));

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

function renderFormWithContainer() {
	return render(
		<QueryClientProvider client={new QueryClient()}>
			<CompanyProfileForm company={company} />
		</QueryClientProvider>
	);
}

function renderForm() {
	renderFormWithContainer();
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

	it("explains every field", () => {
		renderForm();

		for (const description of [
			"Aparece no topo dos orçamentos, nos e-mails enviados aos clientes e no portal do cliente.",
			"Sai nos seus orçamentos. Foi definido no cadastro da empresa e não pode ser alterado.",
			"Onde os clientes deixam e retiram os aparelhos. Aparece nos orçamentos e no portal do cliente.",
			"Onde os clientes falam com a assistência. Aparece nos orçamentos e no portal do cliente.",
			"Telefone de contato que aparece nos orçamentos e no portal do cliente.",
			"Opcional. Site ou rede social da assistência, exibido nos orçamentos e no portal do cliente.",
		]) {
			expect(screen.getByText(description)).toBeInTheDocument();
		}
	});

	it("crops a picked logo before uploading it", async () => {
		const user = userEvent.setup();
		const { container } = renderFormWithContainer();
		const input =
			container.querySelector<HTMLInputElement>('input[type="file"]')!;

		await user.upload(
			input,
			new File(["logo"], "logo.png", { type: "image/png" })
		);

		expect(
			await screen.findByText("Ajuste o enquadramento do seu logo.")
		).toBeInTheDocument();
	});

	it("refuses a logo over 5 MB", async () => {
		const user = userEvent.setup();
		const { container } = renderFormWithContainer();
		const input =
			container.querySelector<HTMLInputElement>('input[type="file"]')!;
		const big = new File(["x"], "logo.png", { type: "image/png" });
		Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

		await user.upload(input, big);

		expect(toast.error).toHaveBeenCalledWith({
			text: "A imagem deve ter no máximo 5 MB.",
		});
		expect(
			screen.queryByText("Ajuste o enquadramento do seu logo.")
		).not.toBeInTheDocument();
	});

	it("discards unsaved changes", async () => {
		const user = userEvent.setup();
		renderForm();

		await user.type(screen.getByLabelText("Site"), "https://alfa.dev");
		await user.click(screen.getByRole("button", { name: "Descartar" }));

		expect(screen.getByLabelText("Site")).toHaveValue("");
		expect(
			screen.queryByRole("button", { name: "Descartar" })
		).not.toBeInTheDocument();
	});
});

describe("CompanyProfileFormSkeleton", () => {
	it("keeps the form's labels and descriptions while loading", () => {
		render(<CompanyProfileFormSkeleton />);

		for (const label of [
			"Razão social",
			"CNPJ",
			"Endereço",
			"E-mail de contato",
			"Telefone",
			"Site",
		]) {
			expect(screen.getByText(label)).toBeInTheDocument();
		}
		expect(
			screen.getByText(
				"Telefone de contato que aparece nos orçamentos e no portal do cliente."
			)
		).toBeInTheDocument();
	});
});
