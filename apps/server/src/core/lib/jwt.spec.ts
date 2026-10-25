import { fastifyJwt } from "@fastify/jwt";
import { createId } from "@paralleldrive/cuid2";
import { fastify } from "fastify";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const payload = {
	id: createId(),
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	company: {
		id: createId(),
		name: "Fixr",
		subdomain: "fixr",
		role: "manager" as const,
	},
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

async function jwtInstance(secret = "a".repeat(32)) {
	const app = fastify();
	await app.register(fastifyJwt, { secret });
	await app.ready();
	return app.jwt;
}

describe("jwt helpers", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.resetModules();
	});

	it("throws a clear error when no signer is bound", async () => {
		const { signJWT } = await import("./jwt");

		expect(() => signJWT({ payload })).toThrow(/buildApp/);
	});

	describe("with a bound signer", () => {
		let jwt: Awaited<ReturnType<typeof jwtInstance>>;

		beforeAll(async () => {
			jwt = await jwtInstance();
		});

		it("signs a token that round-trips the payload", async () => {
			const { bindJWT, signJWT, verifyJWT } = await import("./jwt");
			bindJWT(jwt);

			const token = signJWT({ payload });
			const result = verifyJWT(token);

			expect(result.expired).toBe(false);
			expect(result.payload).toMatchObject({
				id: payload.id,
				company: { role: "manager" },
			});
		});

		it("expires after 300s by default", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			const { bindJWT, signJWT, verifyJWT } = await import("./jwt");
			bindJWT(jwt);

			const token = signJWT({ payload });

			vi.setSystemTime(new Date("2024-01-01T00:04:59.000Z"));
			expect(verifyJWT(token).expired).toBe(false);

			vi.setSystemTime(new Date("2024-01-01T00:05:01.000Z"));
			expect(verifyJWT(token)).toEqual({ payload: null, expired: true });
		});

		it("honours a custom expiresIn", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			const { bindJWT, signJWT, verifyJWT } = await import("./jwt");
			bindJWT(jwt);

			const token = signJWT({ payload, expiresIn: "1h" });
			vi.setSystemTime(new Date("2024-01-01T00:59:00.000Z"));

			expect(verifyJWT(token).expired).toBe(false);
		});

		it("rejects a tampered token", async () => {
			const { bindJWT, signJWT, verifyJWT } = await import("./jwt");
			bindJWT(jwt);
			const [header, body, signature] = signJWT({ payload }).split(".");
			const forgedBody = Buffer.from(
				JSON.stringify({
					...payload,
					company: { ...payload.company, role: "admin" },
				})
			).toString("base64url");

			expect(
				verifyJWT(`${header}.${forgedBody}.${signature}`).payload
			).toBeNull();
			expect(verifyJWT(`${header}.${body}.x`).payload).toBeNull();
		});

		it("rejects a token signed with another secret", async () => {
			const { bindJWT, verifyJWT } = await import("./jwt");
			bindJWT(jwt);
			const other = await jwtInstance("b".repeat(32));

			expect(verifyJWT(other.sign(payload)).payload).toBeNull();
		});
	});
});
