import { env } from "@fixr/env/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "./app-error";
import { verifyTurnstileToken } from "./turnstile";

const fetchMock = vi.fn();

function jsonResponse(body: unknown) {
	return { json: async () => body } as Response;
}

describe("verifyTurnstileToken", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	it("resolves when Cloudflare reports success", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true }));

		await expect(
			verifyTurnstileToken("token", "1.2.3.4")
		).resolves.toBeUndefined();

		const [url, init] = fetchMock.mock.calls[0]!;
		expect(url).toBe(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify"
		);
		const body = init.body as FormData;
		expect(body.get("secret")).toBe(env.TURNSTILE_SECRET_KEY);
		expect(body.get("response")).toBe("token");
		expect(body.get("remoteip")).toBe("1.2.3.4");
	});

	it("omits remoteip when no ip is given", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true }));

		await verifyTurnstileToken("token");

		expect((fetchMock.mock.calls[0]![1].body as FormData).has("remoteip")).toBe(
			false
		);
	});

	it("throws TURNSTILE_VALIDATION_FAILED when Cloudflare rejects the token", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({
				success: false,
				"error-codes": ["invalid-input-response"],
			})
		);

		await expect(verifyTurnstileToken("bad")).rejects.toMatchObject({
			code: "turnstile_validation_failed",
		});
	});

	it("fails closed on a malformed response", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));

		await expect(verifyTurnstileToken("x")).rejects.toBeInstanceOf(AppError);
	});

	it("propagates network errors (the request is not let through)", async () => {
		fetchMock.mockRejectedValue(new TypeError("fetch failed"));

		await expect(verifyTurnstileToken("x")).rejects.toThrow("fetch failed");
	});
});
