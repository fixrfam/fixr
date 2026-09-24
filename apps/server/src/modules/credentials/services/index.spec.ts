import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	AuthRepository: { queryUserById: vi.fn(), queryUserByEmail: vi.fn() },
	TokensRepository: {
		deleteUserExpiredTokensByEmail: vi.fn(),
		getUserOneTimeTokensWithEmail: vi.fn(),
		queryOneTimeToken: vi.fn(),
		deleteOneTimeToken: vi.fn(),
	},
	TokensService: { createOneTimeToken: vi.fn() },
	CredentialsRepository: { updateUserPassword: vi.fn() },
	queueEmail: vi.fn(),
}));

vi.mock("../../auth/repositories", () => ({
	AuthRepository: mocks.AuthRepository,
}));
vi.mock("../../tokens/repositories", () => ({
	TokensRepository: mocks.TokensRepository,
}));
vi.mock("../../tokens/services", () => ({
	TokensService: mocks.TokensService,
}));
vi.mock("../repositories", () => ({
	CredentialsRepository: mocks.CredentialsRepository,
}));
vi.mock("@fixr/mail/queue", () => ({
	createEmailQueue: vi.fn(() => "email-queue"),
	queueEmail: mocks.queueEmail,
}));
vi.mock("@fixr/mail/services", () => ({
	emailDisplayName: (email: string) => email.split("@")[0],
}));

const { CredentialsService } = await import(".");

const OLD = "0ld!Password";
const NEW = "N3w!Password";
const userId = createId();

const jwtUser = {
	id: userId,
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	iat: 0,
	exp: 0,
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("CredentialsService.changePasswordAuthenticated", () => {
	beforeEach(() => {
		mocks.AuthRepository.queryUserById.mockResolvedValue({
			id: userId,
			passwordHash: bcrypt.hashSync(OLD, 4),
		});
	});

	it("requires the current password", async () => {
		await expect(
			CredentialsService.changePasswordAuthenticated({
				user: jwtUser,
				body: { old: "Wr0ng!Pass", new: NEW },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "invalid_password" });
		expect(
			mocks.CredentialsRepository.updateUserPassword
		).not.toHaveBeenCalled();
	});

	it("rejects a new password equal to the old one", async () => {
		await expect(
			CredentialsService.changePasswordAuthenticated({
				user: jwtUser,
				body: { old: OLD, new: OLD },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "equal_passwords" });
	});

	it("stores a hash of the new password", async () => {
		const reply = createFakeReply();

		await CredentialsService.changePasswordAuthenticated({
			user: jwtUser,
			body: { old: OLD, new: NEW },
			response: asReply(reply),
		});

		const [id, hash] =
			mocks.CredentialsRepository.updateUserPassword.mock.calls[0]!;
		expect(id).toBe(userId);
		expect(await bcrypt.compare(NEW, hash)).toBe(true);
		expect(reply.state.body).toMatchObject({ code: "password_update_success" });
	});
});

describe("CredentialsService.requestPasswordReset", () => {
	beforeEach(() => {
		mocks.TokensRepository.getUserOneTimeTokensWithEmail.mockResolvedValue([]);
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue({
			id: userId,
			email: "a@fixr.test",
			displayName: null,
		});
		mocks.TokensService.createOneTimeToken.mockResolvedValue({ token: "a/b" });
	});

	it("prunes expired tokens, creates a reset token and queues the email", async () => {
		const reply = createFakeReply();

		await CredentialsService.requestPasswordReset({
			email: "a@fixr.test",
			response: asReply(reply),
		});

		expect(
			mocks.TokensRepository.deleteUserExpiredTokensByEmail
		).toHaveBeenCalledWith("a@fixr.test");
		expect(mocks.TokensService.createOneTimeToken).toHaveBeenCalledWith({
			userId,
			email: "a@fixr.test",
			tokenType: "password_reset",
		});
		expect(mocks.queueEmail).toHaveBeenCalledWith("email-queue", {
			job: "sendPasswordResetEmail",
			payload: expect.objectContaining({
				to: "a@fixr.test",
				displayName: "a",
				verificationUrl: `http://localhost:3000/auth/forgot-password/${encodeURIComponent("a/b")}`,
			}),
		});
		expect(reply.state.statusCode).toBe(201);
	});

	it("rejects a second request while one is pending", async () => {
		mocks.TokensRepository.getUserOneTimeTokensWithEmail.mockResolvedValue([
			{ tokenType: "password_reset" },
		]);

		await expect(
			CredentialsService.requestPasswordReset({
				email: "a@fixr.test",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "existing_password_reset_request" });
		expect(mocks.queueEmail).not.toHaveBeenCalled();
	});

	it("ignores pending tokens of other types", async () => {
		mocks.TokensRepository.getUserOneTimeTokensWithEmail.mockResolvedValue([
			{ tokenType: "confirmation" },
		]);

		await CredentialsService.requestPasswordReset({
			email: "a@fixr.test",
			response: asReply(createFakeReply()),
		});

		expect(mocks.queueEmail).toHaveBeenCalled();
	});

	// Known gap (tracked in the #95 findings): an unknown email returns 404 instead of the
	// same 201 as a known one, which enables account enumeration.
	it("currently answers an unknown email with 404 user_not_found", async () => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(null);

		await expect(
			CredentialsService.requestPasswordReset({
				email: "ghost@fixr.test",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "user_not_found", status: 404 });
		expect(mocks.queueEmail).not.toHaveBeenCalled();
	});
});

describe.each([
	["confirmPasswordReset", "password_update_success"],
	["validatePasswordResetToken", "password_reset_token_valid"],
] as const)("CredentialsService.%s", (method, successCode) => {
	const run = (response: ReturnType<typeof createFakeReply>) =>
		method === "confirmPasswordReset"
			? CredentialsService.confirmPasswordReset({
					body: { token: "tok", password: NEW },
					response: asReply(response),
				})
			: CredentialsService.validatePasswordResetToken({
					token: "tok",
					response: asReply(response),
				});

	const stored = (overrides: Record<string, unknown> = {}) => ({
		token: "tok",
		tokenType: "password_reset",
		expiresAt: new Date(Date.now() + 60_000),
		user: { id: userId },
		...overrides,
	});

	it.each([
		["a missing token", undefined, "token_not_found"],
		[
			"an expired token",
			stored({ expiresAt: new Date(Date.now() - 1) }),
			"token_expired",
		],
		[
			"a token of another type",
			stored({ tokenType: "confirmation" }),
			"invalid_token",
		],
	])("rejects %s", async (_label, token, code) => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token);

		await expect(run(createFakeReply())).rejects.toMatchObject({ code });
		expect(
			mocks.CredentialsRepository.updateUserPassword
		).not.toHaveBeenCalled();
	});

	it("succeeds with a valid token", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(stored());
		const reply = createFakeReply();

		await run(reply);

		expect(reply.state.body).toMatchObject({ code: successCode });
	});
});

describe("CredentialsService.confirmPasswordReset", () => {
	it("updates the password and consumes the token (single use)", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue({
			token: "tok",
			tokenType: "password_reset",
			expiresAt: new Date(Date.now() + 60_000),
			user: { id: userId },
		});

		await CredentialsService.confirmPasswordReset({
			body: { token: "tok", password: NEW },
			response: asReply(createFakeReply()),
		});

		const [id, hash] =
			mocks.CredentialsRepository.updateUserPassword.mock.calls[0]!;
		expect(id).toBe(userId);
		expect(await bcrypt.compare(NEW, hash)).toBe(true);
		expect(mocks.TokensRepository.deleteOneTimeToken).toHaveBeenCalledWith(
			"tok"
		);
	});

	it("validatePasswordResetToken does not consume the token", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue({
			token: "tok",
			tokenType: "password_reset",
			expiresAt: new Date(Date.now() + 60_000),
			user: { id: userId },
		});

		await CredentialsService.validatePasswordResetToken({
			token: "tok",
			response: asReply(createFakeReply()),
		});

		expect(mocks.TokensRepository.deleteOneTimeToken).not.toHaveBeenCalled();
	});
});
