import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("../config/resend", () => ({ resend: { emails: { send } } }));

const { emailDisplayName, emails } = await import("./mailing");

beforeEach(() => {
	send.mockReset();
	vi.spyOn(console, "log").mockImplementation(() => undefined);
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("emailDisplayName", () => {
	it("uses the local part of the email", () => {
		expect(emailDisplayName("maria.silva@fixr.test")).toBe("maria.silva");
	});
});

describe("email senders", () => {
	const linkProps = {
		to: "maria@fixr.test",
		appName: "Fixr",
		displayName: "maria",
		verificationUrl: "https://fixr.test/x",
	};

	it.each([
		["sendAccountVerificationEmail", "Verify your email, @maria!"],
		["sendAccountDeletionEmail", "maria's account delete confirmation."],
		["sendPasswordResetEmail", "Esqueceu sua senha, maria?"],
	] as const)("%s sends rendered HTML to the recipient", async (sender, subject) => {
		send.mockResolvedValue({ data: { id: "e1" }, error: null });

		const result = await emails[sender](linkProps);

		expect(result).toEqual({ id: "e1" });
		const [message] = send.mock.calls[0]!;
		expect(message).toMatchObject({ to: ["maria@fixr.test"], subject });
		expect(message.html).toContain("https://fixr.test/x");
	});

	it("sendInviteEmail sends the invite", async () => {
		send.mockResolvedValue({ data: { id: "e2" }, error: null });

		await emails.sendInviteEmail({
			to: "joao@fixr.test",
			appName: "Fixr",
			displayName: "João",
			companyName: "Central",
			password: "P@ss1word",
			ctaUrl: "https://fixr.test/login",
		});

		expect(send.mock.calls[0]![0].html).toContain("Central");
	});

	it("throws when Resend reports an error (so the worker retries)", async () => {
		send.mockResolvedValue({ data: null, error: { message: "rate limited" } });

		await expect(
			emails.sendPasswordResetEmail(linkProps)
		).rejects.toMatchObject({
			message: "rate limited",
		});
	});

	it("throws when the Resend call itself fails", async () => {
		send.mockRejectedValue(new Error("network"));

		await expect(emails.sendPasswordResetEmail(linkProps)).rejects.toThrow(
			"network"
		);
	});
});
