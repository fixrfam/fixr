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
		["sendPasswordResetEmail", "Forgot your password, maria?"],
	] as const)("%s sends rendered HTML to the recipient", async (sender, subject) => {
		send.mockResolvedValue({ data: { id: "e1" }, error: null });

		const result = await emails[sender](linkProps);

		expect(result).toEqual({ id: "e1" });
		const [message] = send.mock.calls[0]!;
		expect(message).toMatchObject({ to: ["maria@fixr.test"], subject });
		expect(message.html).toContain("https://fixr.test/x");
	});

	it.each([
		["sendAccountVerificationEmail", "Confirme seu email, @maria!"],
		["sendAccountDeletionEmail", "Confirmação de exclusão da conta de maria."],
		["sendPasswordResetEmail", "Esqueceu sua senha, maria?"],
	] as const)("%s writes the subject in the recipient's locale", async (sender, subject) => {
		send.mockResolvedValue({ data: { id: "e1" }, error: null });

		await emails[sender]({ ...linkProps, locale: "pt-BR" });

		expect(send.mock.calls[0]![0]).toMatchObject({ subject });
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
		expect(send.mock.calls[0]![0].subject).toContain("Welcome to Fixr");
	});

	it("sendInviteEmail follows the recipient's locale", async () => {
		send.mockResolvedValue({ data: { id: "e2" }, error: null });

		await emails.sendInviteEmail({
			to: "joao@fixr.test",
			appName: "Fixr",
			displayName: "João",
			companyName: "Central",
			password: "P@ss1word",
			ctaUrl: "https://fixr.test/login",
			locale: "pt-BR",
		});

		expect(send.mock.calls[0]![0].subject).toContain("Bem-vindo ao Fixr");
	});

	it("sendEstimateEmail attaches the PDF and names the estimate in the subject", async () => {
		send.mockResolvedValue({ data: { id: "e3" }, error: null });

		await emails.sendEstimateEmail({
			to: "maria@fixr.test",
			appName: "Fixr",
			clientName: "Maria",
			companyName: "Central",
			number: "0042",
			device: "Galaxy S21",
			total: "R$ 450,00",
			validUntil: "23/11/2026",
			ctaUrl: "https://fixr.test/estimate/tok3n",
			locale: "pt-BR",
			attachment: { fileName: "orcamento-0042.pdf", contentBase64: "JVBERi0=" },
		});

		const [message] = send.mock.calls[0]!;
		expect(message.subject).toBe("Orçamento #0042 da Central");
		expect(message.html).toContain("https://fixr.test/estimate/tok3n");
		expect(message.attachments).toEqual([
			{ filename: "orcamento-0042.pdf", content: "JVBERi0=" },
		]);
	});

	it.each([
		["Central", "Suas ordens de serviço na Central"],
		[null, "Seu link para acompanhar suas ordens de serviço"],
	] as const)("sendPortalAccessEmail names the shop when it sent the link (%s)", async (companyName, subject) => {
		send.mockResolvedValue({ data: { id: "e4" }, error: null });

		await emails.sendPortalAccessEmail({
			to: "maria@fixr.test",
			appName: "Fixr",
			clientName: "Maria",
			companyName,
			ctaUrl: "https://fixr.test/portal/tok3n",
			locale: "pt-BR",
		});

		const [message] = send.mock.calls[0]!;
		expect(message.subject).toBe(subject);
		expect(message.html).toContain("https://fixr.test/portal/tok3n");
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
