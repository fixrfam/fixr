import { fastifyJwt } from "@fastify/jwt";
import { cookieKey } from "@fixr/constants/cookies";
import { permissions } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import { fastify } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMiddlewareApp } from "@/test/helpers/middleware-app";
import { AppError } from "../lib/app-error";
import { authenticate } from "./authenticate";
import { authenticateEmployee } from "./authenticate-employee";

const queryUserById = vi.hoisted(() => vi.fn());

vi.mock("../../modules/auth/repositories", () => ({
	AuthRepository: { queryUserById },
}));

const userId = createId();

function payload(role?: string) {
	return {
		id: userId,
		email: "a@fixr.test",
		displayName: null,
		avatarUrl: null,
		profileType: role ? "employee" : "client",
		company: role
			? { id: createId(), name: "Fixr", subdomain: "fixr", role }
			: undefined,
		createdAt: new Date(),
	};
}

async function appWith(
	middleware: typeof authenticate | typeof authenticateEmployee
) {
	const app = await createMiddlewareApp();
	app.get("/me", { preHandler: middleware }, (request) => ({
		id: request.user.id,
		canCreateEmployees: request.ability.can(permissions.employees.create),
	}));
	await app.ready();
	return app;
}

describe.each([
	["authenticate", authenticate],
	["authenticateEmployee", authenticateEmployee],
])("%s", (_name, middleware) => {
	beforeEach(() => {
		queryUserById.mockReset();
		queryUserById.mockResolvedValue({ id: userId, profileType: "employee" });
	});

	it("rejects a request without token with 401", async () => {
		const app = await appWith(middleware);

		const response = await app.inject({ method: "GET", url: "/me" });

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("auth_jwt_invalid");
	});

	it("rejects a malformed token with 401", async () => {
		const app = await appWith(middleware);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: "not-a-jwt" },
		});

		expect(response.statusCode).toBe(401);
	});

	it("rejects an expired token with 401", async () => {
		const app = await appWith(middleware);
		const expired = app.jwt.sign({
			...payload("admin"),
			exp: Math.floor(Date.now() / 1000) - 10,
		});

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: expired },
		});

		expect(response.statusCode).toBe(401);
	});

	it("rejects a token signed with another secret", async () => {
		const app = await appWith(middleware);
		const forger = fastify();
		await forger.register(fastifyJwt, { secret: "x".repeat(40) });
		await forger.ready();

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: forger.jwt.sign(payload("admin")) },
		});

		expect(response.statusCode).toBe(401);
	});

	it("accepts a valid token, populates request.user and the role ability", async () => {
		const app = await appWith(middleware);
		const token = app.jwt.sign(payload("admin"));

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: token },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ id: userId, canCreateEmployees: true });
		expect(queryUserById).toHaveBeenCalledWith(userId);
	});

	it("gives a token without company the guest ability", async () => {
		queryUserById.mockResolvedValue({ id: userId, profileType: "employee" });
		const app = await appWith(middleware);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: app.jwt.sign(payload()) },
		});

		expect(response.json().canCreateEmployees).toBe(false);
	});

	it("rejects a token whose user no longer exists with 404", async () => {
		queryUserById.mockResolvedValue(null);
		const app = await appWith(middleware);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: app.jwt.sign(payload("admin")) },
		});

		expect(response.statusCode).toBe(404);
	});

	it("propagates unexpected AppErrors untouched", async () => {
		queryUserById.mockRejectedValue(new AppError("INTERNAL_ERROR"));
		const app = await appWith(middleware);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: app.jwt.sign(payload("admin")) },
		});

		expect(response.statusCode).toBe(500);
		expect(response.json().code).toBe("internal_error");
	});
});

describe("authenticateEmployee", () => {
	it("rejects a non-employee account with 403", async () => {
		queryUserById.mockResolvedValue({ id: userId, profileType: "client" });
		const app = await appWith(authenticateEmployee);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: app.jwt.sign(payload()) },
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("forbidden");
	});
});

describe("authenticate", () => {
	it("accepts client accounts", async () => {
		queryUserById.mockResolvedValue({ id: userId, profileType: "client" });
		const app = await appWith(authenticate);

		const response = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [cookieKey("session")]: app.jwt.sign(payload()) },
		});

		expect(response.statusCode).toBe(200);
	});
});
