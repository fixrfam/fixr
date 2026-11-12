import { cookieKey } from "@fixr/constants/cookies";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	AuthRepository: {
		queryUserByEmail: vi.fn(),
		createUser: vi.fn(),
		deleteUser: vi.fn(),
		queryJWTPayloadByUserId: vi.fn(),
		setUserVerified: vi.fn(),
		updateUserWithGoogleData: vi.fn(),
	},
	TokensRepository: {
		queryOneTimeToken: vi.fn(),
		deleteOneTimeToken: vi.fn(),
		queryTokenData: vi.fn(),
		deleteRefreshToken: vi.fn(),
	},
	TokensService: {
		createOneTimeToken: vi.fn(),
		setRefreshToken: vi.fn(),
		setJWTCookie: vi.fn(),
	},
	sendAccountVerificationEmail: vi.fn(),
	signJWT: vi.fn(() => "signed.jwt.token"),
	google: { getToken: vi.fn(), verifyIdToken: vi.fn() },
}));

vi.mock("../repositories", () => ({ AuthRepository: mocks.AuthRepository }));
vi.mock("../../tokens/repositories", () => ({
	TokensRepository: mocks.TokensRepository,
}));
vi.mock("../../tokens/services", () => ({
	TokensService: mocks.TokensService,
}));
vi.mock("../../../core/lib/jwt", () => ({ signJWT: mocks.signJWT }));
vi.mock("@fixr/mail/services", () => ({
	sendAccountVerificationEmail: mocks.sendAccountVerificationEmail,
	emailDisplayName: (email: string) => email.split("@")[0],
}));
vi.mock("google-auth-library", () => ({
	OAuth2Client: vi.fn(function OAuth2Client() {
		return mocks.google;
	}),
}));

const { AuthService, GOOGLE_STATE_COOKIE } = await import(".");

const PASSWORD = "Str0ng!Pass";
const passwordHash = bcrypt.hashSync(PASSWORD, 4);
const userId = createId();

const user = (overrides: Record<string, unknown> = {}) => ({
	id: userId,
	email: "john@fixr.test",
	displayName: "John",
	avatarUrl: null,
	profileType: "employee",
	passwordHash,
	verified: true,
	createdAt: new Date(),
	...overrides,
});

const jwtPayload = {
	id: userId,
	email: "john@fixr.test",
	displayName: "John",
	avatarUrl: null,
	profileType: "employee",
	company: { id: createId(), name: "Fixr", subdomain: "fixr", role: "manager" },
	createdAt: new Date(),
};

const request = {
	protocol: "https",
	host: "api.fixr.test",
	headers: { "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
	cookies: {},
} as never;

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe("AuthService.register", () => {
	beforeEach(() => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(null);
		mocks.AuthRepository.createUser.mockImplementation(async (data) => ({
			...user(),
			...data,
		}));
		mocks.TokensService.createOneTimeToken.mockResolvedValue({
			token: "a/b+c",
		});
		mocks.sendAccountVerificationEmail.mockResolvedValue(undefined);
	});

	it("rejects an email that is already registered", async () => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(user());

		await expect(
			AuthService.register({
				body: { email: "John@Fixr.test", password: PASSWORD },
				request,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "email_already_used", status: 409 });
		expect(mocks.AuthRepository.queryUserByEmail).toHaveBeenCalledWith(
			"john@fixr.test"
		);
		expect(mocks.AuthRepository.createUser).not.toHaveBeenCalled();
	});

	it("hashes the password before it reaches the repository", async () => {
		const reply = createFakeReply();

		await AuthService.register({
			body: { email: "new@fixr.test", password: PASSWORD, displayName: "New" },
			request,
			response: asReply(reply),
		});

		const [created] = mocks.AuthRepository.createUser.mock.calls[0]!;
		expect(created).not.toHaveProperty("password");
		expect(created.passwordHash).not.toBe(PASSWORD);
		expect(await bcrypt.compare(PASSWORD, created.passwordHash)).toBe(true);
		expect(reply.state.statusCode).toBe(201);
	});

	it("creates a confirmation token and emails an encoded verification link", async () => {
		await AuthService.register({
			body: { email: "new@fixr.test", password: PASSWORD },
			request,
			response: asReply(createFakeReply()),
		});

		expect(mocks.TokensService.createOneTimeToken).toHaveBeenCalledWith(
			expect.objectContaining({ tokenType: "confirmation" })
		);
		const [email] = mocks.sendAccountVerificationEmail.mock.calls[0]!;
		expect(email.verificationUrl).toBe(
			`http://localhost:3333/auth/verify?token=${encodeURIComponent("a/b+c")}&redirectUrl=${encodeURIComponent("http://localhost:3000/auth/login")}`
		);
	});

	it("writes the verification email in the language the browser asks for", async () => {
		await AuthService.register({
			body: { email: "new@fixr.test", password: PASSWORD },
			request,
			response: asReply(createFakeReply()),
		});

		const [email] = mocks.sendAccountVerificationEmail.mock.calls[0]!;
		expect(email.locale).toBe("pt-BR");
	});

	it("rolls the user back and fails when the verification email cannot be sent", async () => {
		mocks.sendAccountVerificationEmail.mockRejectedValue(
			new Error("resend down")
		);

		await expect(
			AuthService.register({
				body: { email: "new@fixr.test", password: PASSWORD },
				request,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "verification_email_failed" });
		expect(mocks.AuthRepository.deleteUser).toHaveBeenCalledWith(userId);
	});
});

describe("AuthService.login", () => {
	beforeEach(() => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(user());
		mocks.AuthRepository.queryJWTPayloadByUserId.mockResolvedValue(jwtPayload);
	});

	it("issues an access token and a refresh token on success", async () => {
		const reply = createFakeReply();

		await AuthService.login({
			body: { email: "JOHN@fixr.test", password: PASSWORD },
			response: asReply(reply),
		});

		expect(mocks.AuthRepository.queryUserByEmail).toHaveBeenCalledWith(
			"john@fixr.test"
		);
		expect(reply.state.statusCode).toBe(200);
		expect(reply.state.body).toMatchObject({
			code: "login_success",
			data: { token: "signed.jwt.token" },
		});
		expect(mocks.TokensService.setRefreshToken).toHaveBeenCalledWith(
			reply,
			expect.objectContaining({ token: expect.any(String) }),
			userId
		);
		expect(mocks.TokensService.setJWTCookie).toHaveBeenCalledWith(
			reply,
			"signed.jwt.token"
		);
	});

	it("puts user.company.role into the JWT payload", async () => {
		await AuthService.login({
			body: { email: "john@fixr.test", password: PASSWORD },
			response: asReply(createFakeReply()),
		});

		const [{ payload }] = mocks.signJWT.mock.calls[0] as unknown as [
			{ payload: typeof jwtPayload },
		];
		expect(payload.company.role).toBe("manager");
	});

	it("rejects an unknown email", async () => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(null);

		await expect(
			AuthService.login({
				body: { email: "ghost@fixr.test", password: PASSWORD },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "user_not_found", status: 404 });
	});

	it("rejects a wrong password", async () => {
		await expect(
			AuthService.login({
				body: { email: "john@fixr.test", password: "Wr0ng!Pass" },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "invalid_password", status: 401 });
		expect(mocks.TokensService.setRefreshToken).not.toHaveBeenCalled();
	});

	it("rejects an unverified account before checking the password", async () => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(
			user({ verified: false })
		);

		await expect(
			AuthService.login({
				body: { email: "john@fixr.test", password: "anything" },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "email_not_verified", status: 403 });
	});

	// Known gap (tracked in the #95 findings): unknown email (404 user_not_found) and wrong
	// password (401 invalid_password) are distinguishable, which enables account enumeration.
	// The web app maps both codes to different messages, so unifying them is a product call.
	it("currently distinguishes unknown email from wrong password", async () => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValueOnce(null);
		const unknown = await AuthService.login({
			body: { email: "ghost@fixr.test", password: PASSWORD },
			response: asReply(createFakeReply()),
		}).catch((e) => e);
		const wrong = await AuthService.login({
			body: { email: "john@fixr.test", password: "Wr0ng!Pass" },
			response: asReply(createFakeReply()),
		}).catch((e) => e);

		expect(unknown.code).not.toBe(wrong.code);
	});
});

describe("AuthService.verify", () => {
	const token = (overrides: Record<string, unknown> = {}) => ({
		token: "tok",
		tokenType: "confirmation",
		expiresAt: new Date(Date.now() + 60_000),
		user: { id: userId },
		...overrides,
	});

	it("marks the user verified and consumes the token", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token());
		const reply = createFakeReply();

		await AuthService.verify({ token: "tok", response: asReply(reply) });

		expect(mocks.AuthRepository.setUserVerified).toHaveBeenCalledWith(userId);
		expect(mocks.TokensRepository.deleteOneTimeToken).toHaveBeenCalledWith(
			"tok"
		);
		expect(reply.state.body).toMatchObject({ code: "email_verify_success" });
	});

	it("redirects with the verified-dialog cookie when a redirectUrl is given", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token());
		const reply = createFakeReply();

		await AuthService.verify({
			token: "tok",
			redirectUrl: encodeURIComponent("http://localhost:3000/auth/login?x=1"),
			response: asReply(reply),
		});

		expect(reply.state.redirectUrl).toBe(
			"http://localhost:3000/auth/login?x=1"
		);
		expect(reply.state.cookies[cookieKey("showVerifiedDialog")]?.value).toBe(
			"true"
		);
	});

	it("sends a redirectUrl on another site to the login page instead", async () => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(token());
		const reply = createFakeReply();

		await AuthService.verify({
			token: "tok",
			redirectUrl: encodeURIComponent("https://attacker.example/phish"),
			response: asReply(reply),
		});

		expect(reply.state.redirectUrl).toBe("http://localhost:3000/auth/login");
	});

	it.each([
		["a missing token", undefined, "token_not_found"],
		[
			"an expired token",
			token({ expiresAt: new Date(Date.now() - 1) }),
			"token_expired",
		],
		[
			"a token of another type",
			token({ tokenType: "password_reset" }),
			"invalid_token",
		],
	])("rejects %s", async (_label, stored, code) => {
		mocks.TokensRepository.queryOneTimeToken.mockResolvedValue(stored);

		await expect(
			AuthService.verify({ token: "tok", response: asReply(createFakeReply()) })
		).rejects.toMatchObject({ code });
		expect(mocks.AuthRepository.setUserVerified).not.toHaveBeenCalled();
	});
});

describe("AuthService.signOut / revalidate", () => {
	const refresh = (overrides: Record<string, unknown> = {}) => ({
		token: "refresh",
		expiresAt: new Date(Date.now() + 60_000),
		user: { id: userId },
		...overrides,
	});

	describe.each([
		["signOut", AuthService.signOut.bind(AuthService)],
		["revalidate", AuthService.revalidate.bind(AuthService)],
	])("%s", (_name, run) => {
		it.each([
			["no refresh token", undefined, undefined, "no_refresh_provided"],
			["an unknown refresh token", "refresh", undefined, "invalid_refresh"],
			[
				"an expired refresh token",
				"refresh",
				refresh({ expiresAt: new Date(Date.now() - 1) }),
				"refresh_expired",
			],
			[
				"a token without user",
				"refresh",
				refresh({ user: null }),
				"user_not_found",
			],
		])("rejects %s", async (_label, cookie, stored, code) => {
			mocks.TokensRepository.queryTokenData.mockResolvedValue(stored);

			await expect(
				run({ refreshToken: cookie, response: asReply(createFakeReply()) })
			).rejects.toMatchObject({ code });
			expect(mocks.TokensRepository.deleteRefreshToken).not.toHaveBeenCalled();
		});
	});

	it("signOut revokes the refresh token", async () => {
		mocks.TokensRepository.queryTokenData.mockResolvedValue(refresh());
		const reply = createFakeReply();

		await AuthService.signOut({
			refreshToken: "refresh",
			response: asReply(reply),
		});

		expect(mocks.TokensRepository.deleteRefreshToken).toHaveBeenCalledWith(
			"refresh"
		);
		expect(reply.state.body).toMatchObject({ code: "signout_success" });
	});

	it("revalidate rotates the refresh token and issues a new JWT", async () => {
		mocks.TokensRepository.queryTokenData.mockResolvedValue(refresh());
		mocks.AuthRepository.queryJWTPayloadByUserId.mockResolvedValue(jwtPayload);
		const reply = createFakeReply();

		await AuthService.revalidate({
			refreshToken: "refresh",
			response: asReply(reply),
		});

		expect(mocks.TokensRepository.deleteRefreshToken).toHaveBeenCalledWith(
			"refresh"
		);
		const [, newRefresh] = mocks.TokensService.setRefreshToken.mock.calls[0]!;
		expect(newRefresh.token).not.toBe("refresh");
		expect(reply.state.body).toMatchObject({
			code: "revalidate_success",
			data: { token: "signed.jwt.token" },
		});
	});
});

describe("AuthService.googleLogin", () => {
	it("redirects to Google's consent screen with the configured client", () => {
		const reply = createFakeReply();

		AuthService.googleLogin({ response: asReply(reply) });

		const url = new URL(reply.state.redirectUrl!);
		expect(url.origin + url.pathname).toBe(
			"https://accounts.google.com/o/oauth2/v2/auth"
		);
		expect(url.searchParams.get("client_id")).toBe("test-google-client-id");
		expect(url.searchParams.get("scope")).toBe("openid email profile");
	});

	it("sends a random state and keeps it in an httpOnly cookie", () => {
		const reply = createFakeReply();

		AuthService.googleLogin({ response: asReply(reply) });

		const state = new URL(reply.state.redirectUrl!).searchParams.get("state");
		const cookie = reply.state.cookies[GOOGLE_STATE_COOKIE];
		expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(cookie?.value).toBe(state);
		expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true });
	});

	it("sends a different state on every sign-in", () => {
		const first = createFakeReply();
		const second = createFakeReply();

		AuthService.googleLogin({ response: asReply(first) });
		AuthService.googleLogin({ response: asReply(second) });

		expect(first.state.cookies[GOOGLE_STATE_COOKIE]?.value).not.toBe(
			second.state.cookies[GOOGLE_STATE_COOKIE]?.value
		);
	});
});

describe("AuthService.googleCallback", () => {
	const sameState = { state: "st", expectedState: "st" };
	const ticket = (payload: Record<string, unknown> | undefined) => ({
		getPayload: () => payload,
	});

	beforeEach(() => {
		mocks.google.getToken.mockResolvedValue({ tokens: { id_token: "id" } });
		mocks.AuthRepository.queryJWTPayloadByUserId.mockResolvedValue(jwtPayload);
	});

	it("rejects a missing code", async () => {
		await expect(
			AuthService.googleCallback({
				code: "",
				...sameState,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "missing_code" });
	});

	it.each([
		["the state differs from the cookie", { state: "a", expectedState: "b" }],
		["the browser has no state cookie", { state: "a" }],
		["Google sent no state", { expectedState: "a" }],
	])("refuses the sign-in before exchanging the code when %s", async (_label, states) => {
		const reply = createFakeReply();

		await AuthService.googleCallback({
			code: "c",
			...states,
			response: asReply(reply),
		});

		expect(mocks.google.getToken).not.toHaveBeenCalled();
		expect(reply.state.redirectUrl).toBe("http://localhost:3000/auth/login");
		expect(reply.state.cookies[cookieKey("googleAuthError")]?.value).toBe(
			"gacc_state_mismatch"
		);
		expect(reply.state.clearedCookies).toContain(GOOGLE_STATE_COOKIE);
	});

	it("fails with google_auth_failed when Google rejects the token", async () => {
		mocks.google.verifyIdToken.mockRejectedValue(new Error("invalid token"));

		await expect(
			AuthService.googleCallback({
				code: "c",
				...sameState,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "google_auth_failed" });
	});

	it("fails when Google returns no id_token", async () => {
		mocks.google.getToken.mockResolvedValue({ tokens: {} });

		await expect(
			AuthService.googleCallback({
				code: "c",
				...sameState,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "google_auth_failed" });
	});

	it.each([
		["the Google account has no email", {}, null, "gacc_missing_email"],
		[
			"no user exists for the email (no sign-up through Google)",
			{ email: "x@fixr.test", email_verified: true },
			null,
			"gacc_user_not_found",
		],
		[
			"the Google email is not verified",
			{ email: "john@fixr.test", email_verified: false },
			user(),
			"gacc_email_not_verified",
		],
		[
			"the local account is not verified",
			{ email: "john@fixr.test", email_verified: true },
			user({ verified: false }),
			"gacc_email_not_verified",
		],
	])("redirects to login with an error cookie when %s", async (_label, payload, existing, error) => {
		mocks.google.verifyIdToken.mockResolvedValue(ticket(payload));
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(existing);
		const reply = createFakeReply();

		await AuthService.googleCallback({
			code: "c",
			...sameState,
			response: asReply(reply),
		});

		expect(reply.state.redirectUrl).toBe("http://localhost:3000/auth/login");
		expect(reply.state.cookies[cookieKey("googleAuthError")]?.value).toBe(
			error
		);
		expect(mocks.TokensService.setRefreshToken).not.toHaveBeenCalled();
	});

	it("links the Google profile to the existing account and signs the user in", async () => {
		const payload = {
			email: "JOHN@fixr.test",
			email_verified: true,
			sub: "google-sub",
			picture: "https://img.test/a.png",
		};
		mocks.google.verifyIdToken.mockResolvedValue(ticket(payload));
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(user());
		const reply = createFakeReply();

		await AuthService.googleCallback({
			code: "c",
			...sameState,
			response: asReply(reply),
		});

		expect(mocks.AuthRepository.queryUserByEmail).toHaveBeenCalledWith(
			"john@fixr.test"
		);
		expect(mocks.AuthRepository.updateUserWithGoogleData).toHaveBeenCalledWith({
			userId,
			data: payload,
		});
		expect(mocks.TokensService.setJWTCookie).toHaveBeenCalled();
		expect(reply.state.redirectUrl).toBe("http://localhost:3000/dashboard");
	});
});
