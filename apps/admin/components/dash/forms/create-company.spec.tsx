import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clerk, signIn, signOut, toast } from "@/test/clerk";
import { apiUrl, envelope, server } from "@/test/msw/server";
import { CreateCompany } from "./create-company";

async function fill(user: ReturnType<typeof userEvent.setup>) {
	await user.type(
		screen.getByPlaceholderText("Acme Inc."),
		"Assistência Central"
	);
	await user.type(
		screen.getByPlaceholderText("12.345.678/0001-00"),
		"11222333000181"
	);
	await user.type(screen.getByPlaceholderText("example"), "central");
	await user.type(
		screen.getByPlaceholderText("email@exemplo.com"),
		"dono@central.test"
	);
	await user.type(screen.getByPlaceholderText("123.456.789-00"), "52998224725");
	await user.click(screen.getByRole("button", { name: "Gerar" }));
}

beforeEach(() => {
	signIn();
});

afterEach(() => {
	signOut();
	vi.clearAllMocks();
});

describe("CreateCompany", () => {
	it("rejects an uppercase subdomain client-side (same rule as the API)", async () => {
		const user = userEvent.setup();
		render(<CreateCompany />);

		await user.type(screen.getByPlaceholderText("example"), "Central");
		await user.tab();

		expect(await screen.findByText(/lowercase letters/i)).toBeInTheDocument();
	});

	it("keeps submit disabled until the form is valid", async () => {
		const user = userEvent.setup();
		render(<CreateCompany />);
		const submit = screen.getByRole("button", { name: /criar/i });

		expect(submit).toBeDisabled();
		await user.type(
			screen.getByPlaceholderText("email@exemplo.com"),
			"not-an-email"
		);

		expect(submit).toBeDisabled();
	});

	it("sends the Clerk session as a bearer token", async () => {
		let auth: string | null = null;
		let body: Record<string, unknown> = {};
		server.use(
			http.post(apiUrl("/companies"), async ({ request }) => {
				auth = request.headers.get("authorization");
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(
					envelope(null, { status: 201, code: "company_create_success" }),
					{ status: 201 }
				);
			})
		);
		const user = userEvent.setup();
		render(<CreateCompany />);

		await fill(user);
		await user.click(screen.getByRole("button", { name: /criar/i }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(auth).toBe("Bearer clerk-session-token");
		expect(body).toMatchObject({
			name: "Assistência Central",
			subdomain: "central",
		});
		expect(clerk.getToken).toHaveBeenCalled();
	});

	it.each([
		[409, "subdomain_taken", "Subdomínio em uso."],
		[401, "auth_jwt_invalid", "Erro!"],
		[403, "forbidden", "Erro!"],
		[500, "internal_error", "Erro!"],
	])("shows the API error for %i %s", async (status, code, title) => {
		server.use(
			http.post(apiUrl("/companies"), () =>
				HttpResponse.json(envelope(null, { status, code }), { status })
			)
		);
		const user = userEvent.setup();
		render(<CreateCompany />);

		await fill(user);
		await user.click(screen.getByRole("button", { name: /criar/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: title })
			)
		);
		expect(toast.success).not.toHaveBeenCalled();
	});
});
