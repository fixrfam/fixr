import type { Locale, StaticTranslationKey, Translator } from "@fixr/i18n";

/** Translation key for the resource half of a permission string. */
const RESOURCE_KEYS: Record<string, StaticTranslationKey> = {
	account: "permissions.resources.account",
	apiKeys: "permissions.resources.apiKeys",
	companies: "permissions.resources.companies",
	customers: "permissions.resources.customers",
	devices: "permissions.resources.devices",
	employees: "permissions.resources.employees",
	estimates: "permissions.resources.estimates",
	inventory: "permissions.resources.inventory",
	logs: "permissions.resources.logs",
	parts: "permissions.resources.parts",
	serviceOrders: "permissions.resources.serviceOrders",
	settings: "permissions.resources.settings",
	suppliers: "permissions.resources.suppliers",
};

/** Translation key for the action half of a permission string. */
const ACTION_KEYS: Record<string, StaticTranslationKey> = {
	adjust: "permissions.actions.adjust",
	assign: "permissions.actions.assign",
	changeStatus: "permissions.actions.changeStatus",
	create: "permissions.actions.create",
	delete: "permissions.actions.delete",
	read: "permissions.actions.read",
	revoke: "permissions.actions.revoke",
	security: "permissions.actions.security",
	sendToCustomer: "permissions.actions.sendToCustomer",
	update: "permissions.actions.update",
};

export interface ScopeGroup {
	resource: string;
	label: string;
	scopes: string[];
}

/** Turns "serviceOrders:read" into "Read". */
export function scopeLabel(t: Translator["t"], scope: string): string {
	const action = scope.split(":")[1] ?? scope;
	const key = ACTION_KEYS[action];

	return key ? t(key) : action;
}

/** Turns "serviceOrders" into "Service orders". */
export function resourceLabel(t: Translator["t"], resource: string): string {
	const key = RESOURCE_KEYS[resource];

	return key ? t(key) : resource;
}

/**
 * Groups flat permission strings by their resource, so the picker can render
 * one row per resource instead of a single long list.
 *
 * @param t - Translator for the active locale
 * @param locale - Locale driving the alphabetical order of the groups
 * @param scopes - Permission strings such as "serviceOrders:read"
 * @returns Groups sorted by their translated label
 */
export function groupScopes(
	t: Translator["t"],
	locale: Locale,
	scopes: string[]
): ScopeGroup[] {
	const byResource = new Map<string, string[]>();

	for (const scope of scopes) {
		const resource = scope.split(":")[0] ?? scope;
		const current = byResource.get(resource) ?? [];
		current.push(scope);
		byResource.set(resource, current);
	}

	return [...byResource.entries()]
		.map(([resource, list]) => ({
			resource,
			label: resourceLabel(t, resource),
			scopes: list,
		}))
		.sort((a, b) => a.label.localeCompare(b.label, locale));
}
