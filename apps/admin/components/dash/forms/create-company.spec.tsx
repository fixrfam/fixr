import { createTranslator } from "@fixr/i18n";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clerk, signIn, signOut, toast } from "@/test/clerk";
import { apiUrl, envelope, server } from "@/test/msw/server";
import { render } from "@/test/render";
import { CreateCompany } from "./create-company";

const { t } = createTranslator("pt-BR");
const placeholder = (
	field:
		| "namePlaceholder"
		| "documentPlaceholder"
		| "subdomainPlaceholder"
		| "ownerEmailPlaceholder"
		| "ownerDocumentPlaceholder"
) => screen.getByPlaceholderText(t(`admin.createCompany.${field}`));
const submitName = new RegExp(t("admin.createCompany.submit"), "i");

async function fill(user: ReturnType<typeof userEvent.setup>) {
	await user.type(placeholder("namePlaceholder"), "Assistência Central");
	await user.type(placeholder("documentPlaceholder"), "11222333000181");
	await user.type(placeholder("subdomainPlaceholder"), "central");
	await user.type(placeholder("ownerEmailPlaceholder"), "dono@central.test");
	await user.type(placeholder("ownerDocumentPlaceholder"), "52998224725");
	await user.click(
		screen.getByRole("button", { name: t("admin.createCompany.generate") })
	);
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

		await user.type(placeholder("subdomainPlaceholder"), "Central");
		await user.tab();

		// Known gap: this schema message is still hardcoded English, not an i18n key.
		expect(await screen.findByText(/lowercase letters/i)).toBeInTheDocument();
	});

	it("keeps submit disabled until the form is valid", async () => {
		const user = userEvent.setup();
		render(<CreateCompany />);
		const submit = screen.getByRole("button", { name: submitName });

		expect(submit).toBeDisabled();
		await user.type(placeholder("ownerEmailPlaceholder"), "not-an-email");

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
		await user.click(screen.getByRole("button", { name: submitName }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(auth).toBe("Bearer clerk-session-token");
		expect(body).toMatchObject({
			name: "Assistência Central",
			subdomain: "central",
		});
		expect(clerk.getToken).toHaveBeenCalled();
	});

	it.each([
		[409, "subdomain_taken", t("messages.codes.subdomain_taken.title")],
		[401, "auth_jwt_invalid", t("messages.fallback.error.title")],
		[403, "forbidden", t("messages.fallback.error.title")],
		[500, "internal_error", t("messages.fallback.error.title")],
	])("shows the API error for %i %s", async (status, code, title) => {
		server.use(
			http.post(apiUrl("/companies"), () =>
				HttpResponse.json(envelope(null, { status, code }), { status })
			)
		);
		const user = userEvent.setup();
		render(<CreateCompany />);

		await fill(user);
		await user.click(screen.getByRole("button", { name: submitName }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: title })
			)
		);
		expect(toast.success).not.toHaveBeenCalled();
	});
});
