import { createAbility, type Permission, permissions } from "@fixr/permissions";
import { employeeRoles } from "@fixr/schemas/roles";
import { describe, expect, it } from "vitest";
import {
	getRequiredPermission,
	getRequiredRoles,
	isPublicRoute,
	matchRoute,
} from "./match-route";
import { type RouteRule, routeRules } from "./routes";

describe("matchRoute", () => {
	it("matches an exact static route", () => {
		expect(matchRoute("/auth/login", routeRules)?.rule.path).toBe(
			"/auth/login"
		);
	});

	it("extracts dynamic segments", () => {
		expect(matchRoute("/dashboard/fixr/employees/abc", routeRules)).toEqual({
			rule: expect.objectContaining({
				path: "/dashboard/:subdomain/employees/:id",
			}),
			params: { subdomain: "fixr", id: "abc" },
		});
	});

	it("prefers the exact rule over an earlier prefix rule", () => {
		expect(
			getRequiredPermission("/dashboard/fixr/service-orders/new", routeRules)
		).toBe(permissions.serviceOrders.create);
		expect(
			getRequiredPermission("/dashboard/fixr/employees/new", routeRules)
		).toBe(permissions.employees.create);
		expect(
			getRequiredPermission("/dashboard/fixr/settings/security", routeRules)
		).toBe(permissions.settings.security);
	});

	it("falls back to the closest prefix for nested pages without a rule", () => {
		expect(
			getRequiredPermission(
				"/dashboard/fixr/service-orders/abc/edit",
				routeRules
			)
		).toBe(permissions.serviceOrders.read);
	});

	it("uses the dashboard catch-all for unknown dashboard pages", () => {
		expect(getRequiredPermission("/dashboard/fixr/whatever", routeRules)).toBe(
			permissions.companies.read
		);
	});

	it("tolerates a trailing slash and ignores the query string / hash", () => {
		expect(
			getRequiredPermission("/dashboard/fixr/service-orders/new/", routeRules)
		).toBe(permissions.serviceOrders.create);
		expect(
			getRequiredPermission("/dashboard/fixr/employees?page=2", routeRules)
		).toBe(permissions.employees.read);
		expect(
			getRequiredPermission("/dashboard/fixr/employees#top", routeRules)
		).toBe(permissions.employees.read);
	});

	it("does not match near misses", () => {
		expect(matchRoute("/auth/loginx", routeRules)).toBeNull();
		expect(matchRoute("/dashboards/fixr", routeRules)).toBeNull();
		expect(matchRoute("/dashboard", routeRules)).toBeNull();
		expect(matchRoute("/unknown", routeRules)).toBeNull();
	});

	it("does not let a dynamic segment swallow slashes", () => {
		const rules: RouteRule[] = [{ path: "/a/:id", public: true }];

		expect(matchRoute("/a/1/2", rules)?.params).toEqual({ id: "1" });
	});
});

describe("parts, services and suppliers routes", () => {
	it.each([
		["/dashboard/fixr/parts", permissions.parts.read],
		["/dashboard/fixr/parts/new", permissions.parts.create],
		["/dashboard/fixr/parts/p1/edit", permissions.parts.update],
		["/dashboard/fixr/services", permissions.services.read],
		["/dashboard/fixr/services/new", permissions.services.create],
		["/dashboard/fixr/services/s1", permissions.services.read],
		["/dashboard/fixr/services/s1/edit", permissions.services.update],
		["/dashboard/fixr/suppliers", permissions.suppliers.read],
		["/dashboard/fixr/suppliers/new", permissions.suppliers.create],
		["/dashboard/fixr/suppliers/sup1", permissions.suppliers.read],
	])("%s requires %s", (path, permission) => {
		expect(getRequiredPermission(path, routeRules)).toBe(permission);
	});

	it("no longer gates parts behind the inventory permission", () => {
		expect(getRequiredPermission("/dashboard/fixr/parts", routeRules)).not.toBe(
			permissions.inventory.read
		);
	});

	it.each([
		[
			"/dashboard/fixr/parts",
			["technician", "warehouse", "financial", "manager", "admin"],
		],
		["/dashboard/fixr/parts/new", ["warehouse", "manager", "admin"]],
		[
			"/dashboard/fixr/services",
			["technician", "warehouse", "financial", "manager", "admin"],
		],
		["/dashboard/fixr/services/s1/edit", ["manager", "admin"]],
		["/dashboard/fixr/suppliers/new", ["warehouse", "manager", "admin"]],
	])("%s is reached by %j", (path, roles) => {
		const permission = getRequiredPermission(path, routeRules) as Permission;
		const allowed = employeeRoles.options.filter((role) =>
			createAbility(role).can(permission)
		);

		expect(allowed).toEqual(roles);
	});
});

describe("isPublicRoute", () => {
	it.each([
		"/",
		"/auth/login",
		"/auth/forgot-password/tok",
		"/downtime",
		"/dashboard/fixr/support",
	])("%s is public", (path) => {
		expect(isPublicRoute(path, routeRules)).toBe(true);
	});

	it.each([
		"/dashboard/fixr",
		"/dashboard/fixr/employees",
		"/unknown",
	])("%s is not public", (path) => {
		expect(isPublicRoute(path, routeRules)).toBe(false);
	});
});

describe("getRequiredRoles", () => {
	const rules: RouteRule[] = [
		{ path: "/admin", roles: ["admin"] },
		{ path: "/open", public: true },
	];

	it("returns the roles of the matched rule", () => {
		expect(getRequiredRoles("/admin", rules)).toEqual(["admin"]);
	});

	it("returns null when the rule has no roles or nothing matches", () => {
		expect(getRequiredRoles("/open", rules)).toBeNull();
		expect(getRequiredRoles("/nope", rules)).toBeNull();
		expect(getRequiredPermission("/nope", rules)).toBeNull();
		expect(getRequiredPermission("/open", rules)).toBeNull();
	});
});

describe("routeRules", () => {
	it("keeps the dashboard catch-all last", () => {
		expect(routeRules.at(-1)?.path).toBe("/dashboard/:subdomain");
	});

	it("only references permissions that exist in @fixr/permissions", () => {
		const catalog = new Set(
			Object.values(permissions).flatMap((group) => Object.values(group))
		);

		for (const rule of routeRules) {
			if (rule.permission) {
				expect(catalog).toContain(rule.permission);
			}
		}
	});

	it("gives every protected dashboard route a permission", () => {
		for (const rule of routeRules) {
			if (rule.path.startsWith("/dashboard") && !rule.public) {
				expect(rule.permission, rule.path).toBeDefined();
			}
		}
	});
});
