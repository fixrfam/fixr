import { db, eq } from "@fixr/db/connection";
import { models } from "@fixr/db/schema";
import { afterAll, describe, expect, it } from "vitest";
import { redis } from "@/src/config/redis";
import { makeMaker, makeModel } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

describe("repository cache (real Redis)", () => {
	it("@Cached populates Redis and serves the second read without the database", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const maker = await makeMaker();
		const model = await makeModel({
			makerId: maker.id,
			companyId: company.id,
			name: "Cached Phone",
		});
		const url = `/companies/${company.subdomain}/models/cached-phone`;

		await authedInject(app, token, { method: "GET", url });
		expect(await redis.keys("models:slug:*")).toHaveLength(1);

		// Change the row behind the cache's back: a cached read must not see it.
		await db
			.update(models)
			.set({ price: "stale?" })
			.where(eq(models.id, model.id));
		const second = await authedInject(app, token, { method: "GET", url });

		expect(second.json().data.price).toBeNull();
	});

	it("@InvalidateCache: a PATCH is visible on the next read", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const maker = await makeMaker();
		const model = await makeModel({
			makerId: maker.id,
			companyId: company.id,
			name: "Fresh Phone",
		});
		const url = `/companies/${company.subdomain}/models/fresh-phone`;

		await authedInject(app, token, { method: "GET", url });
		await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/models/${model.id}`,
			payload: { price: "R$ 1.000" },
		});
		const reread = await authedInject(app, token, { method: "GET", url });

		expect(reread.json().data.price).toBe("R$ 1.000");
	});

	it("@InvalidateCache: a DELETE is visible on the next read", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const maker = await makeMaker();
		const model = await makeModel({
			makerId: maker.id,
			companyId: company.id,
			name: "Gone Phone",
		});
		const url = `/companies/${company.subdomain}/models/gone-phone`;

		await authedInject(app, token, { method: "GET", url });
		await authedInject(app, token, {
			method: "DELETE",
			url: `/companies/${company.subdomain}/models/${model.id}`,
		});

		expect(
			(await authedInject(app, token, { method: "GET", url })).statusCode
		).toBe(404);
	});

	it("cache entries are scoped per company", async () => {
		const maker = await makeMaker();
		const a = await createEmployeeSession(app, { role: "manager" });
		const b = await createEmployeeSession(app, { role: "manager" });
		await makeModel({
			makerId: maker.id,
			companyId: a.company.id,
			name: "Private Phone",
		});

		const ownerRead = await authedInject(app, a.token, {
			method: "GET",
			url: `/companies/${a.company.subdomain}/models/private-phone`,
		});
		const otherRead = await authedInject(app, b.token, {
			method: "GET",
			url: `/companies/${b.company.subdomain}/models/private-phone`,
		});

		expect(ownerRead.statusCode).toBe(200);
		expect(otherRead.statusCode).toBe(404);
	});
});

describe("with Redis unavailable", () => {
	afterAll(async () => {
		await redis.connect().catch(() => undefined);
	});

	it("routes keep answering (fail-open cache) and /health reports Redis as unavailable", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const maker = await makeMaker();
		await makeModel({
			makerId: maker.id,
			companyId: company.id,
			name: "Offline Phone",
		});

		// A manual disconnect makes every command fail fast (no offline queue), like a dead Redis.
		redis.disconnect();

		const read = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/models/offline-phone`,
		});
		const health = await app.inject({ method: "GET", url: "/health" });

		expect(read.statusCode).toBe(200);
		expect(health.statusCode).toBe(200);
		expect(health.json().services.redis.status).toBe("unavailable");
		expect(health.json().status).toBe("unavailable");
	});
});
