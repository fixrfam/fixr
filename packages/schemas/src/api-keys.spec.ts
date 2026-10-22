import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { issuePaths } from "./test-utils";

afterEach(() => {
	vi.useRealTimers();
	vi.resetModules();
});

const load = () => import("./api-keys");

describe("createApiKeySchema", () => {
	it("defaults scopes to [] (inherit the creator's role) and expiresAt to undefined", async () => {
		const { createApiKeySchema } = await load();

		expect(createApiKeySchema.parse({ name: "ERP" })).toEqual({
			name: "ERP",
			scopes: [],
		});
	});

	it("enforces the name length", async () => {
		const { createApiKeySchema } = await load();

		expect(issuePaths(createApiKeySchema, { name: "ab" })).toEqual(["name"]);
		expect(issuePaths(createApiKeySchema, { name: "a".repeat(101) })).toEqual([
			"name",
		]);
	});

	it("limits scopes to 64 strings", async () => {
		const { createApiKeySchema } = await load();

		expect(
			issuePaths(createApiKeySchema, {
				name: "ERP",
				scopes: new Array(65).fill("x"),
			})
		).toEqual(["scopes"]);
	});

	it("coerces a future ISO date and accepts null", async () => {
		const { createApiKeySchema } = await load();
		const future = new Date(Date.now() + 86_400_000).toISOString();

		expect(
			createApiKeySchema.parse({ name: "ERP", expiresAt: future }).expiresAt
		).toBeInstanceOf(Date);
		expect(
			createApiKeySchema.parse({ name: "ERP", expiresAt: null }).expiresAt
		).toBeNull();
	});

	it("rejects an expiration in the past", async () => {
		const { createApiKeySchema } = await load();

		expect(
			issuePaths(createApiKeySchema, {
				name: "ERP",
				expiresAt: "2000-01-01T00:00:00Z",
			})
		).toEqual(["expiresAt"]);
	});

	it("rejects a past expiration even long after the module was loaded", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const { createApiKeySchema } = await load();

		// The process keeps running for a month...
		vi.setSystemTime(new Date("2026-02-01T00:00:00Z"));

		// ...so mid-January is already in the past and must be rejected.
		expect(
			issuePaths(createApiKeySchema, {
				name: "ERP",
				expiresAt: "2026-01-15T00:00:00Z",
			})
		).toEqual(["expiresAt"]);
	});
});

describe("apiKeyIdParamsSchema", () => {
	it("requires a cuid2 id", async () => {
		const { apiKeyIdParamsSchema } = await load();

		expect(
			apiKeyIdParamsSchema.safeParse({ apiKeyId: createId() }).success
		).toBe(true);
		expect(
			issuePaths(apiKeyIdParamsSchema, { apiKeyId: "Not-A-Cuid" })
		).toEqual(["apiKeyId"]);
	});
});

describe("createdApiKeySchema", () => {
	it("requires the one-time secret", async () => {
		const { createdApiKeySchema } = await load();
		const base = {
			id: "k",
			name: "ERP",
			prefix: "abc",
			scopes: [],
			expiresAt: null,
			createdAt: new Date().toISOString(),
		};

		expect(issuePaths(createdApiKeySchema, base)).toEqual(["secret"]);
		expect(
			createdApiKeySchema.safeParse({ ...base, secret: "fxr_x" }).success
		).toBe(true);
	});
});
