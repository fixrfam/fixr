import { createTranslator } from "@fixr/i18n";
import { createAbility, permissions } from "@fixr/permissions";
import { describe, expect, it } from "vitest";
import { groupScopes, resourceLabel, scopeLabel } from "./scope-labels";

const everyPermission = Object.values(permissions).flatMap((group) =>
	Object.values(group)
);

const { t } = createTranslator("en");
const { t: tBR } = createTranslator("pt-BR");

describe("scope labels", () => {
	it("labels the action and the resource of a permission", () => {
		expect(scopeLabel(t, "serviceOrders:changeStatus")).toBe("Change status");
		expect(resourceLabel(t, "apiKeys")).toBe("API keys");
	});

	it("labels in the active locale", () => {
		expect(scopeLabel(tBR, "serviceOrders:changeStatus")).toBe(
			"Alterar status"
		);
		expect(resourceLabel(tBR, "apiKeys")).toBe("Chaves de API");
	});

	it("falls back to the raw value for unknown parts", () => {
		expect(scopeLabel(t, "x:unknown")).toBe("unknown");
		expect(scopeLabel(t, "noaction")).toBe("noaction");
		expect(resourceLabel(t, "mystery")).toBe("mystery");
	});

	it("has a label for every resource and action in @fixr/permissions", () => {
		for (const permission of everyPermission) {
			const [resource, action] = permission.split(":");
			expect(resourceLabel(t, resource!), permission).not.toBe(resource);
			expect(scopeLabel(t, permission), permission).not.toBe(action);
		}
	});

	it("groups scopes by resource, sorted by label", () => {
		const groups = groupScopes(t, "en", [
			"serviceOrders:read",
			"devices:read",
			"serviceOrders:update",
		]);

		expect(groups).toEqual([
			{ resource: "devices", label: "Devices", scopes: ["devices:read"] },
			{
				resource: "serviceOrders",
				label: "Service orders",
				scopes: ["serviceOrders:read", "serviceOrders:update"],
			},
		]);
	});

	it("sorts groups by the translated label", () => {
		// "Parts" < "Suppliers", but "Fornecedores" < "Peças".
		const scopes = ["suppliers:read", "parts:read"];

		expect(groupScopes(t, "en", scopes).map((g) => g.resource)).toEqual([
			"parts",
			"suppliers",
		]);
		expect(groupScopes(tBR, "pt-BR", scopes).map((g) => g.resource)).toEqual([
			"suppliers",
			"parts",
		]);
	});

	it("groups a whole role without losing permissions", () => {
		const scopes = [...createAbility("admin").permissions];

		expect(
			groupScopes(t, "en", scopes)
				.flatMap((g) => g.scopes)
				.sort()
		).toEqual([...scopes].sort());
	});
});
