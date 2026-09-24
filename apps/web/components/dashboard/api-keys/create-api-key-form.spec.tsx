import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/hooks/use-session";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { CreateApiKeyForm } from "./create-api-key-form";

function session(role: string) {
	return {
		id: "ckx1y2z3a4b5c6d7e8f9g0h1",
		email: "maria@fixr.test",
		displayName: "Maria",
		avatarUrl: null,
		profileType: "employee",
		company: {
			id: "ckx1y2z3a4b5c6d7e8f9g0h2",
			name: "Fixr",
			subdomain: "fixr",
			role,
		},
		createdAt: new Date(),
		iat: 1,
		exp: 9_999_999_999,
	};
}

function renderForm(role = "technician") {
	const onCreated = vi.fn();
	render(
		<QueryClientProvider client={new QueryClient()}>
			<SessionProvider session={session(role) as never}>
				<CreateApiKeyForm onCreated={onCreated} />
			</SessionProvider>
		</QueryClientProvider>
	);
	return onCreated;
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CreateApiKeyForm", () => {
	it("only offers scopes the creator's role has", async () => {
		const user = userEvent.setup();
		renderForm("technician");

		await user.click(screen.getByRole("button", { name: /Permissões/ }));

		// technician: serviceOrders read/update/changeStatus but no employees at all.
		expect(screen.getByText("Ordens de Serviço")).toBeInTheDocument();
		expect(screen.queryByText("Funcionários")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Alterar status" })
		).toBeInTheDocument();
	});

	it("creates a key with the selected scopes and hands the secret back once", async () => {
		let body: Record<string, unknown> = {};
		server.use(
			http.post(apiUrl("/companies/fixr/api-keys"), async ({ request }) => {
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(
					envelope(
						{ secret: "fxr_abc_def", name: "ERP" },
						{ status: 201, code: "create_api_key_success" }
					),
					{ status: 201 }
				);
			})
		);
		const user = userEvent.setup();
		const onCreated = renderForm("technician");

		await user.type(screen.getByPlaceholderText("Integração com o ERP"), "ERP");
		await user.click(screen.getByRole("button", { name: /Permissões/ }));
		await user.click(screen.getByRole("button", { name: "Alterar status" }));
		await user.click(screen.getByRole("button", { name: /Criar chave/ }));

		await waitFor(() =>
			expect(onCreated).toHaveBeenCalledWith({
				secret: "fxr_abc_def",
				name: "ERP",
			})
		);
		expect(body).toEqual({
			name: "ERP",
			scopes: ["serviceOrders:changeStatus"],
			expiresAt: null,
		});
	});

	it("shows the API error and does not report a key", async () => {
		server.use(
			http.post(apiUrl("/companies/fixr/api-keys"), () =>
				HttpResponse.json(
					envelope(null, { status: 409, code: "api_key_name_conflict" }),
					{
						status: 409,
					}
				)
			)
		);
		const user = userEvent.setup();
		const onCreated = renderForm();

		await user.type(screen.getByPlaceholderText("Integração com o ERP"), "ERP");
		await user.click(screen.getByRole("button", { name: /Criar chave/ }));

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(onCreated).not.toHaveBeenCalled();
	});

	it("requires a name of at least 3 characters", async () => {
		const user = userEvent.setup();
		renderForm();

		await user.type(screen.getByPlaceholderText("Integração com o ERP"), "ab");

		expect(
			await screen.findByText("O nome deve ter no mínimo 3 caracteres.")
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Criar chave/ })).toBeDisabled();
	});
});
