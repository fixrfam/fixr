import { cookieKey } from "@fixr/constants/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const TokensRepository = vi.hoisted(() => ({
	insertRefreshToken: vi.fn(),
	deleteExpiredRefreshTokens: vi.fn(),
	insertOneTimeToken: vi.fn(),
	queryOneTimeToken: vi.fn(),
}));

vi.mock("../repositories", () => ({ TokensRepository }));

const { TokensService } = await import(".");

const NOW = new Date("2024-01-01T00:00:00.000Z");

describe("TokensService", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("setRefreshToken", () => {
		const refresh = {
			token: "r",
			expires: new Date("2024-01-08T00:00:00.000Z"),
		};

		it("persists the token, prunes expired ones and sets a secure httpOnly cookie", async () => {
			const reply = createFakeReply();

			await TokensService.setRefreshToken(asReply(reply), refresh, "u1");

			expect(TokensRepository.insertRefreshToken).toHaveBeenCalledWith(
				"r",
				refresh.expires,
				"u1"
			);
			expect(TokensRepository.deleteExpiredRefreshTokens).toHaveBeenCalledWith(
				"u1"
			);
			expect(reply.state.cookies[cookieKey("refreshToken")]).toEqual({
				value: "r",
				options: {
					httpOnly: true,
					expires: refresh.expires,
					path: "/",
					sameSite: "none",
					secure: true,
					domain: "localhost",
				},
			});
		});

		// Locks current behavior: Promise.allSettled means a failed insert still sets the cookie.
		it("still sets the cookie when persisting fails", async () => {
			TokensRepository.insertRefreshToken.mockRejectedValue(
				new Error("db down")
			);
			const reply = createFakeReply();

			await TokensService.setRefreshToken(asReply(reply), refresh, "u1");

			expect(reply.state.cookies[cookieKey("refreshToken")]?.value).toBe("r");
		});
	});

	describe("setJWTCookie", () => {
		it("sets a 5 minute session cookie readable by the web app", () => {
			const reply = createFakeReply();

			TokensService.setJWTCookie(asReply(reply), "jwt");

			expect(reply.state.cookies[cookieKey("session")]).toEqual({
				value: "jwt",
				options: {
					path: "/",
					httpOnly: false,
					sameSite: "none",
					expires: new Date("2024-01-01T00:05:00.000Z"),
					secure: true,
					domain: "localhost",
				},
			});
		});
	});

	describe("createOneTimeToken", () => {
		it.each([
			"confirmation",
			"password_reset",
			"account_deletion",
		] as const)("stores a %s token that expires in 30 minutes", async (tokenType) => {
			TokensRepository.queryOneTimeToken.mockImplementation(async (token) => ({
				token,
			}));

			const created = await TokensService.createOneTimeToken({
				userId: "u1",
				email: "a@fixr.test",
				tokenType,
			});

			const [token, userId, type, email, expiresAt] =
				TokensRepository.insertOneTimeToken.mock.calls[0]!;
			expect(created).toEqual({ token });
			expect(token).toMatch(/^[A-Za-z0-9_-]{80,128}$/);
			expect([userId, type, email]).toEqual(["u1", tokenType, "a@fixr.test"]);
			expect(expiresAt).toEqual(new Date("2024-01-01T00:30:00.000Z"));
		});
	});
});
