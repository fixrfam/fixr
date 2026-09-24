import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireTurnstile } from "./turnstile";

const verifyTurnstileToken = vi.hoisted(() => vi.fn());

vi.mock("../lib/turnstile", () => ({ verifyTurnstileToken }));

describe("requireTurnstile", () => {
	beforeEach(() => {
		verifyTurnstileToken.mockReset();
	});

	it("rejects a request without token before calling Cloudflare", async () => {
		await expect(
			requireTurnstile()({ body: {}, ip: "1.1.1.1" } as never, {} as never)
		).rejects.toMatchObject({ code: "turnstile_validation_failed" });
		expect(verifyTurnstileToken).not.toHaveBeenCalled();
	});

	it("rejects a request without body", async () => {
		await expect(
			requireTurnstile()({ body: undefined } as never, {} as never)
		).rejects.toMatchObject({ code: "turnstile_validation_failed" });
	});

	it("verifies the token from the default field with the client ip", async () => {
		verifyTurnstileToken.mockResolvedValue(undefined);

		await requireTurnstile()(
			{ body: { cfTurnstileToken: "tok" }, ip: "1.1.1.1" } as never,
			{} as never
		);

		expect(verifyTurnstileToken).toHaveBeenCalledWith("tok", "1.1.1.1");
	});

	it("reads a custom field name", async () => {
		verifyTurnstileToken.mockResolvedValue(undefined);

		await requireTurnstile("captcha")(
			{ body: { captcha: "tok" }, ip: "2.2.2.2" } as never,
			{} as never
		);

		expect(verifyTurnstileToken).toHaveBeenCalledWith("tok", "2.2.2.2");
	});

	it("propagates a failed verification", async () => {
		verifyTurnstileToken.mockRejectedValue(new Error("rejected"));

		await expect(
			requireTurnstile()(
				{ body: { cfTurnstileToken: "tok" } } as never,
				{} as never
			)
		).rejects.toThrow("rejected");
	});
});
