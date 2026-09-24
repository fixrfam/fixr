/**
 * RBAC sweep over every route registered by buildApp().
 *
 * 1. Static: every route is either explicitly public (allowlist below) or has
 *    an authentication middleware AND a `requirePermission()` guard in its
 *    preHandler. A new route without a guard fails this test.
 * 2. Dynamic: every guarded route is called with a session of every role in
 *    `roleAbilities` and must answer 403 missing_required_permissions exactly
 *    when that role lacks the route's permission. The matrix is derived from
 *    @fixr/permissions, so a new role or permission expands it automatically.
 *
 * UI gating in apps/web is a convenience; this suite is what enforces access.
 */

import { fastifyJwt } from "@fastify/jwt";
import { type EmployeeRole, roleAbilities } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import { fastify, type RouteOptions } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "@/src/app";
import { makeCompany } from "../../factories";
import {
	authedInject,
	createEmployeeSession,
	SESSION_COOKIE,
} from "../../helpers/auth";

interface CollectedRoute {
	method: string;
	url: string;
	preHandlers: { name: string; permission?: string }[];
}

const routes: CollectedRoute[] = [];
const app = await buildApp({
	logger: false,
	docs: false,
	onRoute: (route: RouteOptions) => {
		const methods = ([] as string[]).concat(route.method);
		for (const method of methods) {
			if (method === "HEAD" || method === "OPTIONS") continue;
			routes.push({
				method,
				url: route.url,
				preHandlers: ([] as unknown[])
					.concat(route.preHandler ?? [])
					.map((fn) => fn as { name: string; permission?: string }),
			});
		}
	},
});
await app.ready();

const key = (route: { method: string; url: string }) =>
	`${route.method} ${route.url}`;

/** Routes that are public on purpose. Adding a route here needs a reason. */
const PUBLIC_ROUTES = new Set([
	"GET /",
	"GET /health",
	"GET /public/*",
	"POST /auth/register", // disabled (501), validated before answering
	"POST /auth/login", // Turnstile-protected
	"GET /auth/verify", // e-mail confirmation link
	"GET /auth/signout", // requires the refresh cookie
	"POST /auth/token", // requires the refresh cookie
	"GET /auth/google",
	"GET /auth/google/callback",
	"POST /credentials/password/reset", // Turnstile-protected
	"PUT /credentials/password/reset", // Turnstile + one-time token
	"GET /credentials/password/reset", // one-time token
	"GET /account/confirm-deletion", // one-time token
]);

/** Authenticated routes that intentionally have no RBAC permission. */
const AUTH_ONLY_ROUTES = new Map([
	[
		"PUT /credentials/password",
		"self-service: any signed-in user can change their own password",
	],
	[
		"POST /companies",
		"internal admin panel, authenticated through Clerk (authenticateAdmin)",
	],
]);

/** Routes whose guard is a custom preHandler; verified dynamically below. */
const CUSTOM_GUARD_ROUTES = new Set(["POST /uploads/:purpose/presign"]);

const AUTH_MIDDLEWARES = new Set([
	"authenticate",
	"authenticateEmployee",
	"authenticateAdmin",
]);

const guardedRoutes = routes
	.filter(
		(route) =>
			!(
				PUBLIC_ROUTES.has(key(route)) ||
				AUTH_ONLY_ROUTES.has(key(route)) ||
				CUSTOM_GUARD_ROUTES.has(key(route))
			)
	)
	.map((route) => ({
		...route,
		permission: route.preHandlers.find((fn) => fn.permission)?.permission,
	}));

describe("route guard sweep (static)", () => {
	it("found the routes (sanity check)", () => {
		expect(routes.length).toBeGreaterThan(30);
	});

	it("every allowlisted route still exists", () => {
		const existing = new Set(routes.map(key));
		for (const route of [
			...PUBLIC_ROUTES,
			...AUTH_ONLY_ROUTES.keys(),
			...CUSTOM_GUARD_ROUTES,
		]) {
			expect(existing, `stale allowlist entry: ${route}`).toContain(route);
		}
	});

	it.each(
		guardedRoutes.map((route) => [key(route), route] as const)
	)("%s authenticates and requires a permission", (_key, route) => {
		const names = route.preHandlers.map((fn) => fn.name);

		expect(
			names.some((name) => AUTH_MIDDLEWARES.has(name)),
			"missing authenticate/authenticateEmployee in preHandler"
		).toBe(true);
		expect(
			route.permission,
			"missing requirePermission(...) in preHandler"
		).toBeDefined();
	});

	it.each([
		...AUTH_ONLY_ROUTES.keys(),
	])("%s at least authenticates", (routeKey) => {
		const route = routes.find((r) => key(r) === routeKey)!;

		expect(route.preHandlers.some((fn) => AUTH_MIDDLEWARES.has(fn.name))).toBe(
			true
		);
	});
});

/** Minimal valid payloads so requests get past schema validation (which runs before preHandlers). */
const SAMPLE_BODIES: Record<string, Record<string, unknown>> = {
	"PUT /account/avatar": { url: "https://cdn.test.local/a.png" },
	"POST /companies/:subdomain/employees": {
		name: "Novo Funcionário",
		cpf: "52998224725",
		role: "technician",
		email: "novo@fixr.test",
	},
	"POST /companies/:subdomain/service-orders": {
		clientId: createId(),
		deviceBrandId: createId(),
		deviceCategoryId: createId(),
		deviceModel: "iPhone",
		reportedDefect: "Tela",
	},
	"POST /companies/:subdomain/models": { name: "Model", makerId: "x" },
	"PATCH /companies/:subdomain/models/:modelId": {},
	"POST /companies/:subdomain/models/:modelId/images": { uploadId: "x" },
};

const roles = Object.keys(roleAbilities) as EmployeeRole[];

function requestFor(route: CollectedRoute, subdomain: string) {
	const url = route.url
		.replace(":subdomain", subdomain)
		.replace(/:[a-zA-Z]+/g, "x");
	return {
		method: route.method as "GET",
		url: route.method === "GET" ? `${url}?page=1` : url,
		payload: SAMPLE_BODIES[key(route)],
	};
}

describe("route guard sweep (role x route matrix)", () => {
	let company: Awaited<ReturnType<typeof makeCompany>>;

	beforeEach(async () => {
		company = await makeCompany();
	});

	const matrix = guardedRoutes.flatMap((route) =>
		roles.map((role) => {
			const allowed = roleAbilities[role].includes(route.permission as never);
			return [key(route), role, allowed ? "allowed" : "denied", route] as const;
		})
	);

	it.each(matrix)("%s as %s is %s", async (_key, role, expected, route) => {
		const { token } = await createEmployeeSession(app, { role, company });

		const response = await authedInject(
			app,
			token,
			requestFor(route, company.subdomain)
		);

		if (expected === "denied") {
			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("missing_required_permissions");
		} else {
			expect(response.statusCode).not.toBe(401);
			expect(response.json().code).not.toBe("missing_required_permissions");
		}
	});

	it.each(
		guardedRoutes.map((route) => [key(route), route] as const)
	)("%s without a session is 401", async (_key, route) => {
		const response = await app.inject(requestFor(route, company.subdomain));

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("auth_jwt_invalid");
	});

	it.each(
		guardedRoutes.map((route) => [key(route), route] as const)
	)("%s rejects a token signed with another secret", async (_key, route) => {
		const { employee } = await createEmployeeSession(app, {
			role: "admin",
			company,
		});
		const forger = fastify();
		await forger.register(fastifyJwt, { secret: "f".repeat(48) });
		const forged = forger.jwt.sign({
			id: employee.user.id,
			email: employee.user.email,
			company: { ...company, role: "admin" },
		});

		const response = await app.inject({
			...requestFor(route, company.subdomain),
			cookies: { [SESSION_COOKIE]: forged },
		});

		expect(response.statusCode).toBe(401);
	});
});

describe("POST /uploads/:purpose/presign (custom guard)", () => {
	const body = { fileName: "a.jpg", contentType: "image/jpeg", size: 1024 };

	it.each(
		roles.flatMap((role) => [
			[
				"service-orders",
				role,
				roleAbilities[role].includes("serviceOrders:update"),
			] as const,
			["models", role, roleAbilities[role].includes("devices:update")] as const,
		])
	)("%s as %s allowed=%s", async (purpose, role, allowed) => {
		const { token } = await createEmployeeSession(app, { role });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/uploads/${purpose}/presign`,
			payload: body,
		});

		if (allowed) {
			expect(response.statusCode).toBe(200);
		} else {
			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("missing_required_permissions");
		}
	});

	it.each(roles)("avatar only needs a session (%s)", async (role) => {
		const { token } = await createEmployeeSession(app, { role });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/uploads/avatar/presign",
			payload: body,
		});

		expect(response.statusCode).toBe(200);
	});

	it("requires a session", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/uploads/models/presign",
			payload: body,
		});

		expect(response.statusCode).toBe(401);
	});
});
