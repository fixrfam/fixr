import { createAbility, permissions } from "@fixr/permissions";
import { describe, expect, it } from "vitest";
import { groupScopes, resourceLabel, scopeLabel } from "./scope-labels";

const everyPermission = Object.values(permissions).flatMap((group) =>
	Object.values(group)
);

describe("scope labels", () => {
	it("labels the action and the resource of a permission", () => {
		expect(scopeLabel("serviceOrders:changeStatus")).toBe("Alterar status");
		expect(resourceLabel("apiKeys")).toBe("Chaves de API");
	});

	it("falls back to the raw value for unknown parts", () => {
		expect(scopeLabel("x:unknown")).toBe("unknown");
		expect(scopeLabel("noaction")).toBe("noaction");
		expect(resourceLabel("mystery")).toBe("mystery");
	});

	it("has a label for every resource and action in @fixr/permissions", () => {
		for (const permission of everyPermission) {
			const [resource, action] = permission.split(":");
			expect(resourceLabel(resource!), permission).not.toBe(resource);
			expect(scopeLabel(permission), permission).not.toBe(action);
		}
	});

	it("groups scopes by resource, sorted by label", () => {
		const groups = groupScopes([
			"serviceOrders:read",
			"devices:read",
			"serviceOrders:update",
		]);

		expect(groups).toEqual([
			{ resource: "devices", label: "Aparelhos", scopes: ["devices:read"] },
			{
				resource: "serviceOrders",
				label: "Ordens de Serviço",
				scopes: ["serviceOrders:read", "serviceOrders:update"],
			},
		]);
	});

	it("groups a whole role without losing permissions", () => {
		const scopes = [...createAbility("admin").permissions];

		expect(
			groupScopes(scopes)
				.flatMap((g) => g.scopes)
				.sort()
		).toEqual([...scopes].sort());
	});
});
