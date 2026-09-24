import { roleLabels } from "@fixr/constants/roles";
import { employeeRoles } from "@fixr/schemas/roles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { NewEmployeeForm } from "./create-employee-form";

function renderForm(onSuccess = vi.fn()) {
	const client = new QueryClient();
	render(
		<QueryClientProvider client={client}>
			<NewEmployeeForm onSuccess={onSuccess} />
		</QueryClientProvider>
	);
	return onSuccess;
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
	await user.type(
		screen.getByLabelText(/nome do funcionário/i),
		"João da Silva"
	);
	await user.type(screen.getByPlaceholderText("123.456.789-00"), "52998224725");
	await user.type(
		screen.getByPlaceholderText("email@funcionario.com"),
		"joao@fixr.test"
	);
	await user.click(screen.getByRole("combobox"));
	await user.click(
		await screen.findByRole("option", { name: roleLabels.technician })
	);
	// The password field starts as "" (invalid), so generate one like a user would.
	await user.click(screen.getByRole("button", { name: /gerar/i }));
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("NewEmployeeForm", () => {
	it("only offers roles from employeeRoles in the role select", async () => {
		const user = userEvent.setup();
		renderForm();

		await user.click(screen.getByRole("combobox"));
		const options = await screen.findAllByRole("option");

		expect(options.map((o) => o.textContent).sort()).toEqual(
			employeeRoles.options.map((role) => roleLabels[role]).sort()
		);
	});

	it("posts the unmasked CPF to the company endpoint and reports success", async () => {
		let body: Record<string, unknown> = {};
		server.use(
			http.post(apiUrl("/companies/fixr/employees"), async ({ request }) => {
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(
					envelope(null, { status: 201, code: "create_employee_success" }),
					{ status: 201 }
				);
			})
		);
		const user = userEvent.setup();
		const onSuccess = renderForm();

		await fill(user);
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		await waitFor(() => expect(onSuccess).toHaveBeenCalled());
		expect(body).toMatchObject({
			name: "João da Silva",
			cpf: "52998224725",
			email: "joao@fixr.test",
			role: "technician",
		});
		expect(toast.success).toHaveBeenCalledWith(
			expect.objectContaining({ text: "Sucesso!" })
		);
	});

	it("shows the API error (e.g. role hierarchy) and keeps the form open", async () => {
		server.use(
			http.post(apiUrl("/companies/fixr/employees"), () =>
				HttpResponse.json(
					envelope(null, { status: 403, code: "violates_role_hierarchy" }),
					{ status: 403 }
				)
			)
		);
		const user = userEvent.setup();
		const onSuccess = renderForm();

		await fill(user);
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: "Ação negada" })
			)
		);
		expect(onSuccess).not.toHaveBeenCalled();
	});
});
