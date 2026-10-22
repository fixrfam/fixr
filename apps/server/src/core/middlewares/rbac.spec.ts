import { permissions } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiddlewareApp } from "@/test/helpers/middleware-app";
import { requirePermission, setupRBAC } from "./rbac";

async function appWithRoute(user: unknown) {
	const app = await createMiddlewareApp();
	// The user must be set before setupRBAC's onRequest hook runs.
	app.addHook("onRequest", (request, _reply, done) => {
		(request as { user: unknown }).user = user;
		done();
	});
	setupRBAC(app);
	app.get("/ability", (request) => ({
		permissions: request.ability.permissions,
	}));
	app.get(
		"/guarded",
		{ preHandler: requirePermission(permissions.employees.create) },
		() => ({ ok: true })
	);
	return app;
}

describe("setupRBAC", () => {
	it.each([
		["no user", undefined],
		["a user without company", { id: createId() }],
		["a company without role", { id: createId(), company: { id: createId() } }],
	])("falls back to guest for %s", async (_label, user) => {
		const app = await createMiddlewareApp();
		// The user must be set before setupRBAC's onRequest hook runs.
		app.addHook("onRequest", (request, _reply, done) => {
			(request as { user: unknown }).user = user;
			done();
		});
		setupRBAC(app);
		app.get("/ability", (request) => ({
			permissions: request.ability.permissions,
		}));

		const response = await app.inject({ method: "GET", url: "/ability" });

		expect(response.json()).toEqual({ permissions: [] });
	});

	it("derives the ability from user.company.role", async () => {
		const app = await createMiddlewareApp();
		app.addHook("onRequest", (request, _reply, done) => {
			(request as { user: unknown }).user = {
				company: { role: request.headers["x-role"] },
			};
			done();
		});
		setupRBAC(app);
		app.get("/can", (request) => ({
			can: request.ability.can(permissions.employees.create),
		}));

		const [admin, technician] = await Promise.all([
			app.inject({
				method: "GET",
				url: "/can",
				headers: { "x-role": "admin" },
			}),
			app.inject({
				method: "GET",
				url: "/can",
				headers: { "x-role": "technician" },
			}),
		]);

		expect(admin.json()).toEqual({ can: true });
		expect(technician.json()).toEqual({ can: false });
	});

	it("does not share abilities between concurrent requests", async () => {
		const app = await createMiddlewareApp();
		app.addHook("onRequest", (request, _reply, done) => {
			(request as { user: unknown }).user = {
				company: { role: request.headers["x-role"] },
			};
			done();
		});
		setupRBAC(app);
		app.get("/slow", async (request) => {
			// Give the other request time to run its hooks in between.
			await new Promise((resolve) => setTimeout(resolve, 20));
			return { permissions: request.ability.permissions.length };
		});

		const roles = ["admin", "guest", "technician", "guest", "admin"];
		const responses = await Promise.all(
			roles.map((role) =>
				app.inject({ method: "GET", url: "/slow", headers: { "x-role": role } })
			)
		);

		const counts = responses.map((r) => r.json().permissions);
		expect(counts[1]).toBe(0);
		expect(counts[3]).toBe(0);
		expect(counts[0]).toBe(counts[4]);
		expect(counts[0]).toBeGreaterThan(counts[2]);
	});
});

describe("requirePermission", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lets the request through when the ability grants the permission", async () => {
		const app = await appWithRoute({ company: { role: "admin" } });

		const response = await app.inject({ method: "GET", url: "/guarded" });

		expect(response.statusCode).toBe(200);
	});

	it("rejects with 403 MISSING_PERMISSIONS when it does not", async () => {
		const app = await appWithRoute({ company: { role: "technician" } });

		const response = await app.inject({ method: "GET", url: "/guarded" });

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("missing_required_permissions");
	});

	it("calls done() without error / with an AppError", () => {
		const done = vi.fn();
		const guard = requirePermission(permissions.devices.read);

		guard({ ability: { cannot: () => false } } as never, {} as never, done);
		expect(done).toHaveBeenCalledWith();

		guard({ ability: { cannot: () => true } } as never, {} as never, done);
		expect(done).toHaveBeenLastCalledWith(
			expect.objectContaining({ code: "missing_required_permissions" })
		);
	});
});
