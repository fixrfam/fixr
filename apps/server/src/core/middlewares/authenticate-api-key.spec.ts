import { permissions } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMiddlewareApp } from "@/test/helpers/middleware-app";
import { redisMock } from "@/test/helpers/redis-mock";
import { generateApiKey } from "../lib/api-key";
import { authenticateApiKey } from "./authenticate-api-key";

const repo = vi.hoisted(() => ({
	getByPrefix: vi.fn(),
	touchLastUsedAt: vi.fn(),
}));

vi.mock("../../modules/api-keys/repositories", () => ({
	ApiKeysRepository: repo,
}));

const key = generateApiKey();

function storedKey(overrides: Record<string, unknown> = {}) {
	return {
		id: createId(),
		prefix: key.prefix,
		keyHash: key.keyHash,
		scopes: [] as string[],
		expiresAt: null,
		revokedAt: null,
		employeeRole: "manager",
		employeeName: "Marcos",
		companyId: createId(),
		companyName: "Fixr",
		companySubdomain: "fixr",
		userId: createId(),
		userEmail: "marcos@fixr.test",
		userAvatarUrl: null,
		userCreatedAt: new Date(),
		...overrides,
	};
}

async function appWithRoute() {
	const app = await createMiddlewareApp();
	app.get("/me", { preHandler: authenticateApiKey }, (request) => ({
		user: request.user,
		apiKey: request.apiKey,
		permissions: request.ability.permissions,
		canCreateModels: request.ability.can(permissions.devices.create),
		cannotReadEmployees: request.ability.cannot(permissions.employees.read),
	}));
	return app;
}

const call = async (headers: Record<string, string>) =>
	(await appWithRoute()).inject({ method: "GET", url: "/me", headers });

beforeEach(() => {
	repo.getByPrefix.mockResolvedValue(storedKey());
	redisMock.set.mockResolvedValue("OK");
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("authenticateApiKey", () => {
	it.each([
		["x-api-key", { "x-api-key": key.token }],
		["a bearer token", { authorization: `Bearer ${key.token}` }],
	])("authenticates with %s and exposes the owner as request.user", async (_label, headers) => {
		const response = await call(headers);

		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({
			user: {
				email: "marcos@fixr.test",
				company: { subdomain: "fixr", role: "manager" },
			},
			apiKey: { prefix: key.prefix },
			canCreateModels: true,
		});
		expect(repo.getByPrefix).toHaveBeenCalledWith(key.prefix);
	});

	it.each([
		["no credentials", {}],
		["a malformed token", { "x-api-key": "fxr_nope" }],
	])("rejects %s with 401", async (_label, headers) => {
		const response = await call(headers);

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("api_key_credentials_invalid");
	});

	it("rejects an unknown prefix", async () => {
		repo.getByPrefix.mockResolvedValue(undefined);

		const response = await call({ "x-api-key": key.token });

		expect(response.json().code).toBe("api_key_credentials_invalid");
	});

	it("rejects a wrong secret for a known prefix (same error as unknown)", async () => {
		const other = generateApiKey();
		const forged = `fxr_${key.prefix}_${other.token.slice(-43)}`;

		const response = await call({ "x-api-key": forged });

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("api_key_credentials_invalid");
	});

	it("rejects a revoked key", async () => {
		repo.getByPrefix.mockResolvedValue(storedKey({ revokedAt: new Date() }));

		expect((await call({ "x-api-key": key.token })).json().code).toBe(
			"api_key_revoked"
		);
	});

	it("rejects an expired key, and accepts one that expires later", async () => {
		repo.getByPrefix.mockResolvedValueOnce(
			storedKey({ expiresAt: new Date(Date.now() - 1000) })
		);
		expect((await call({ "x-api-key": key.token })).json().code).toBe(
			"api_key_expired"
		);

		repo.getByPrefix.mockResolvedValueOnce(
			storedKey({ expiresAt: new Date(Date.now() + 60_000).toISOString() })
		);
		expect((await call({ "x-api-key": key.token })).statusCode).toBe(200);
	});

	it("narrows the ability to the key scopes (a scope never widens the role)", async () => {
		repo.getByPrefix.mockResolvedValue(
			storedKey({
				employeeRole: "technician",
				scopes: [permissions.serviceOrders.read, permissions.devices.create],
			})
		);

		const response = await call({ "x-api-key": key.token });

		// technician has serviceOrders:read but not devices:create.
		expect(response.json().permissions).toEqual([
			permissions.serviceOrders.read,
		]);
		expect(response.json().canCreateModels).toBe(false);
	});

	it("inherits the current role when the key has no scopes", async () => {
		repo.getByPrefix.mockResolvedValue(
			storedKey({ employeeRole: "warehouse" })
		);

		const response = await call({ "x-api-key": key.token });

		expect(response.json().permissions).toContain(permissions.inventory.update);
		expect(response.json().canCreateModels).toBe(false);
	});

	it("records usage at most once per window, and never fails the request because of it", async () => {
		await call({ "x-api-key": key.token });
		expect(repo.touchLastUsedAt).toHaveBeenCalledTimes(1);

		redisMock.set.mockResolvedValue(null);
		await call({ "x-api-key": key.token });
		expect(repo.touchLastUsedAt).toHaveBeenCalledTimes(1);

		redisMock.set.mockRejectedValue(new Error("redis down"));
		expect((await call({ "x-api-key": key.token })).statusCode).toBe(200);
	});
});
