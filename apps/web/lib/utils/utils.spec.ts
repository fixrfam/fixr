import { passwordSchema } from "@fixr/schemas/auth";
import { describe, expect, it } from "vitest";
import { generateRandomPassword } from "./generate-random-password";
import { getDashboardRouteName } from "./get-dashboard-route-name";
import {
	getStatusClass,
	getStatusClassTable,
	SERVICE_ORDER_LIFECYCLE,
	SERVICE_ORDER_STATUS_LABELS,
	STATUS_STYLE_MAP,
} from "./service-orders";

describe("generateRandomPassword", () => {
	it("always satisfies the API password policy", () => {
		for (let i = 0; i < 100; i++) {
			expect(passwordSchema.safeParse(generateRandomPassword()).success).toBe(
				true
			);
		}
	});

	it("honours the length bounds", () => {
		expect(generateRandomPassword(20)).toHaveLength(20);
		expect(() => generateRandomPassword(7)).toThrow();
		expect(() => generateRandomPassword(129)).toThrow();
	});
});

describe("getDashboardRouteName", () => {
	it.each([
		["/dashboard/fixr/home", "Início"],
		["/dashboard/fixr/service-orders", "Ordens de Serviço"],
		["/dashboard/fixr/settings/security", "Segurança"],
		["/dashboard/fixr/employees/", "Funcionários"],
	])("%s -> %s", (path, name) => {
		expect(getDashboardRouteName(path)).toBe(name);
	});

	it.each([
		"/dashboard/fixr/employees/abc123",
		"/",
		"",
	])("falls back to Fixr for %j", (path) => {
		expect(getDashboardRouteName(path)).toBe("Fixr");
	});
});

describe("service order status helpers", () => {
	it("has a label for every status", () => {
		expect(Object.keys(SERVICE_ORDER_STATUS_LABELS).sort()).toEqual(
			Object.keys(STATUS_STYLE_MAP).sort()
		);
	});

	it("builds the lifecycle from known statuses, without canceled", () => {
		for (const status of SERVICE_ORDER_LIFECYCLE) {
			expect(STATUS_STYLE_MAP).toHaveProperty(status);
		}
		expect(SERVICE_ORDER_LIFECYCLE).not.toContain("canceled");
		expect(SERVICE_ORDER_LIFECYCLE[0]).toBe("registered");
		expect(SERVICE_ORDER_LIFECYCLE.at(-1)).toBe("finished");
	});

	it("returns the style for a status and a neutral fallback otherwise", () => {
		expect(getStatusClass("canceled")).toContain("bg-rose-400");
		expect(getStatusClassTable("finished")).toBe("bg-blue-400 text-blue-900");
		expect(getStatusClass("unknown" as never)).toBe(
			"bg-gray-100 text-gray-900"
		);
		expect(getStatusClassTable("unknown" as never)).toBe(
			"bg-gray-100 text-gray-900"
		);
	});

	// Known gap (tracked in the #95 findings): the web statuses do not match the API enum
	// (pending, diagnosing, waiting_approval, approved, fixing, ready, delivered).
	it("currently uses a status vocabulary different from the API", () => {
		expect(SERVICE_ORDER_LIFECYCLE).not.toContain("pending");
	});
});
