import { cookieKey } from "@fixr/constants/cookies";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	AccountRepository: { updateAvatarUrl: vi.fn(), queryAccountById: vi.fn() },
	AuthRepository: { queryJWTPayloadByUserId: vi.fn(), deleteUser: vi.fn() },
	TokensRepository: {
		deleteUserExpiredTokensByUserId: vi.fn(),
		getUserOneTimeTokens: vi.fn(),
		queryOneTimeToken: vi.fn(),
	},
	TokensService: { createOneTimeToken: vi.fn(), setJWTCookie: vi.fn() },
	sendAccountDeletionEmail: vi.fn(),
	signJWT: vi.fn(() => "new.jwt"),
}));

vi.mock("../repositories", () => ({
	AccountRepository: mocks.AccountRepository,
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
vi.mock("../../../core/lib/jwt", () => ({ signJWT: mocks.signJWT }));
vi.mock("@fixr/mail/services", () => ({
	sendAccountDeletionEmail: mocks.sendAccountDeletionEmail,
	emailDisplayName: (email: string) => email.split("@")[0],
}));

const { AccountService } = await import(".");

const userId = createId();
const account = {
	id: userId,
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	cpf: "52998224725",
	profileType: "employee",
	createdAt: new Date(),
};
const payload = {
	id: userId,
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee",
	createdAt: new Date(),
};

beforeEach(() => {
	mocks.AccountRepository.queryAccountById.mockResolvedValue(account);
	mocks.AuthRepository.queryJWTPayloadByUserId.mockResolvedValue(payload);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("AccountService.getAccount", () => {
	it("returns the account of the given user only", async () => {
		const reply = createFakeReply();

		await AccountService.getAccount({ userId, response: asReply(reply) });

		expect(mocks.AccountRepository.queryAccountById).toHaveBeenCalledWith(
			userId
		);
		expect(reply.state.body).toMatchObject({
			code: "get_account_success",
			data: account,
		});
	});
});

describe("AccountService avatar", () => {
	it("updates the avatar and refreshes the session cookie with the new payload", async () => {
		const reply = createFakeReply();

		await AccountService.updateAvatar({
			userId,
			avatarUrl: "https://cdn.test.local/users/u/avatar.png",
			response: asReply(reply),
		});

		expect(mocks.AccountRepository.updateAvatarUrl).toHaveBeenCalledWith(
			userId,
			"https://cdn.test.local/users/u/avatar.png"
		);
		expect(mocks.TokensService.setJWTCookie).toHaveBeenCalledWith(
			reply,
			"new.jwt"
		);
		expect(reply.state.body).toMatchObject({ code: "update_avatar_success" });
	});

	it("removes the avatar by setting it to null", async () => {
		const reply = createFakeReply();

		await AccountService.removeAvatar({ userId, response: asReply(reply) });

		expect(mocks.AccountRepository.updateAvatarUrl).toHaveBeenCalledWith(
			userId,
			null
		);
		expect(reply.state.body).toMatchObject({ code: "remove_avatar_success" });
	});
});

describe("AccountService.requestAccountDeletion", () => {
	beforeEach(() => {
		mocks.TokensRepository.getUserOneTimeTokens.mockResolvedValue([]);
		mocks.TokensService.createOneTimeToken.mockResolvedValue({ token: "t+1" });
	});

	it("creates a deletion token and emails a confirmation link", async () => {
		const reply = createFakeReply();

		await AccountService.requestAccountDeletion({
			userId,
			request: { protocol: "https", host: "api.test" } as never,
			response: asReply(reply),
		});

		expect(
			mocks.TokensRepository.deleteUserExpiredTokensByUserId
		).toHaveBeenCalledWith(userId);
		expect(mocks.TokensService.createOneTimeToken).toHaveBeenCalledWith({
			userId,
			email: "a@fixr.test",
			tokenType: "account_deletion",
		});
		const [email] = mocks.sendAccountDeletionEmail.mock.calls[0]!;
		expect(email.verificationUrl).toContain(
			`https://api.test/account/confirm-deletion?token=${encodeURIComponent("t+1")}`
		);
		expect(reply.state.statusCode).toBe(201);
	});

	it("rejects a second request while one is pending", async () => {
		mocks.TokensRepository.getUserOneTimeTokens.mockResolvedValue([
			{ tokenType: "account_deletion" },
		]);

		await expect(
			AccountService.requestAccountDeletion({
				userId,
				request: {} as never,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "existing_deletion_request", status: 409 });
		expect(mocks.sendAccountDeletionEmail).not.toHaveBeenCalled();
	});
});

describe("AccountService.confirmAccountDeletion", () => {
	const token = (overrides: Record<string, unknown> = {}) => ({
		token: "tok",
		tokenType: "account_deletion",
		expiresAt: new Date(Date.now() + 60_000),
		user: { id: userId },
		...overrides,
	});

	it("deletes the token owner's account", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token());
		const reply = createFakeReply();

		await AccountService.confirmAccountDeletion({
			token: "tok",
			response: asReply(reply),
		});

		expect(mocks.AuthRepository.deleteUser).toHaveBeenCalledWith(userId);
		expect(reply.state.body).toMatchObject({
			code: "account_deletion_success",
		});
	});

	it("redirects with the deleted-dialog cookie when a redirectUrl is given", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token());
		const reply = createFakeReply();

		await AccountService.confirmAccountDeletion({
			token: "tok",
			redirectUrl: encodeURIComponent("https://app.test/login"),
			response: asReply(reply),
		});

		expect(reply.state.redirectUrl).toBe("https://app.test/login");
		expect(reply.state.cookies[cookieKey("showDeletedDialog")]?.value).toBe(
			"true"
		);
	});

	it.each([
		["a missing token", undefined, "token_not_found"],
		[
			"an expired token",
			token({ expiresAt: new Date(Date.now() - 1) }),
			"token_expired",
		],
		[
			"a password reset token",
			token({ tokenType: "password_reset" }),
			"invalid_token",
		],
	])("rejects %s without deleting anything", async (_label, stored, code) => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(stored);

		await expect(
			AccountService.confirmAccountDeletion({
				token: "tok",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code });
		expect(mocks.AuthRepository.deleteUser).not.toHaveBeenCalled();
	});
});
