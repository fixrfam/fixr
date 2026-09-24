import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeJwt } from "@/test/jwt";
import { router, toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { LoginForm } from "./login-form";

afterEach(() => {
	vi.clearAllMocks();
});

async function fillAndSubmit(email: string, password: string) {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText(/e-mail/i), email);
	await user.type(screen.getByLabelText(/senha/i), password);
	await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginForm", () => {
	it("keeps submit disabled until the form is valid", async () => {
		const user = userEvent.setup();
		render(<LoginForm />);
		const submit = screen.getByRole("button", { name: "Entrar" });

		expect(submit).toBeDisabled();
		await user.type(screen.getByLabelText(/e-mail/i), "not-an-email");
		await user.type(screen.getByLabelText(/senha/i), "x");

		expect(await screen.findByText("Email inválido")).toBeInTheDocument();
		expect(submit).toBeDisabled();
	});

	it("logs in with the Turnstile token and goes to the company dashboard", async () => {
		let body: Record<string, unknown> = {};
		server.use(
			http.post(apiUrl("/auth/login"), async ({ request }) => {
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(
					envelope({ token: fakeJwt() }, { code: "login_success" })
				);
			})
		);
		render(<LoginForm />);

		await fillAndSubmit("maria@fixr.test", "Str0ng!Pass");

		await waitFor(() =>
			expect(router.push).toHaveBeenCalledWith("/dashboard/fixr/account")
		);
		expect(body).toEqual({
			email: "maria@fixr.test",
			password: "Str0ng!Pass",
			cfTurnstileToken: "turnstile-test-token",
		});
		expect(toast.success).toHaveBeenCalledWith(
			expect.objectContaining({ text: "Login realizado!" })
		);
	});

	it.each([
		[401, "invalid_password", "Senha incorreta"],
		[404, "user_not_found", "Usuário não encontrado"],
		[403, "email_not_verified", "Email não verificado"],
	])("shows the API error (%i %s) instead of swallowing it", async (status, code, title) => {
		server.use(
			http.post(apiUrl("/auth/login"), () =>
				HttpResponse.json(envelope(null, { status, code }), { status })
			)
		);
		render(<LoginForm />);

		await fillAndSubmit("maria@fixr.test", "Wr0ng!Pass");

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: title })
			)
		);
		expect(router.push).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
	});

	it("falls back to a generic message for unknown errors", async () => {
		server.use(
			http.post(apiUrl("/auth/login"), () =>
				HttpResponse.json(envelope(null, { status: 500, code: "weird" }), {
					status: 500,
				})
			)
		);
		render(<LoginForm />);

		await fillAndSubmit("maria@fixr.test", "Str0ng!Pass");

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: "Ops! Algo deu errado." })
			)
		);
	});

	it("links to the password recovery page", () => {
		render(<LoginForm />);

		expect(
			screen.getByRole("link", { name: "Esqueceu sua senha?" })
		).toHaveAttribute("href", "/auth/forgot-password");
	});
});
