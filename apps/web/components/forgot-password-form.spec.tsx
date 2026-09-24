import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { ForgotPasswordForm } from "./forgot-password-form";

afterEach(() => {
	vi.clearAllMocks();
});

async function submit(email: string) {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText(/e-mail/i), email);
	await user.click(
		screen.getByRole("button", { name: /enviar|redefinir|continuar/i })
	);
}

describe("ForgotPasswordForm", () => {
	it("requests the reset and reports success", async () => {
		const onSuccess = vi.fn();
		server.use(
			http.post(apiUrl("/credentials/password/reset"), () =>
				HttpResponse.json(
					envelope(null, {
						status: 201,
						code: "password_reset_request_accepted",
					}),
					{ status: 201 }
				)
			)
		);
		render(<ForgotPasswordForm onSuccess={onSuccess} />);

		await submit("maria@fixr.test");

		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(true));
		expect(toast.success).toHaveBeenCalled();
	});

	it("shows the API error and does not report success", async () => {
		const onSuccess = vi.fn();
		server.use(
			http.post(apiUrl("/credentials/password/reset"), () =>
				HttpResponse.json(
					envelope(null, {
						status: 409,
						code: "existing_password_reset_request",
					}),
					{ status: 409 }
				)
			)
		);
		render(<ForgotPasswordForm onSuccess={onSuccess} />);

		await submit("maria@fixr.test");

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("validates the email client-side", async () => {
		const user = userEvent.setup();
		render(<ForgotPasswordForm onSuccess={vi.fn()} />);

		await user.type(screen.getByLabelText(/e-mail/i), "nope");
		await user.tab();

		expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /enviar|redefinir|continuar/i })
		).toBeDisabled();
	});
});
