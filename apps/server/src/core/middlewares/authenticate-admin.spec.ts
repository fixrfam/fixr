import { env } from "@fixr/env/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/app-error";
import { authenticateAdmin } from "./authenticate-admin";

const verifyToken = vi.hoisted(() => vi.fn());

vi.mock("@clerk/backend", () => ({ verifyToken }));

function request(authorization?: string) {
	return { headers: { authorization } } as never;
}

describe("authenticateAdmin", () => {
	beforeEach(() => {
		verifyToken.mockReset();
	});

	it.each([
		["missing", undefined],
		["not a bearer token", "Basic abc"],
	])("rejects a %s authorization header", async (_label, header) => {
		await expect(
			authenticateAdmin(request(header), {} as never)
		).rejects.toMatchObject({ code: "auth_jwt_invalid" });
		expect(verifyToken).not.toHaveBeenCalled();
	});

	it("verifies the bearer token with the Clerk secret key", async () => {
		verifyToken.mockResolvedValue({ sub: "user_1" });

		await expect(
			authenticateAdmin(request("Bearer clerk-token"), {} as never)
		).resolves.toBeUndefined();
		expect(verifyToken).toHaveBeenCalledWith("clerk-token", {
			secretKey: env.CLERK_SECRET_KEY,
		});
	});

	it("maps an invalid Clerk session to AUTH_JWT_INVALID", async () => {
		verifyToken.mockRejectedValue(new Error("token expired"));

		const error = await authenticateAdmin(
			request("Bearer bad"),
			{} as never
		).catch((e) => e);

		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(401);
	});

	it("rethrows AppErrors as is", async () => {
		verifyToken.mockRejectedValue(new AppError("RESOURCE_FORBIDDEN"));

		await expect(
			authenticateAdmin(request("Bearer x"), {} as never)
		).rejects.toMatchObject({ code: "forbidden" });
	});
});
