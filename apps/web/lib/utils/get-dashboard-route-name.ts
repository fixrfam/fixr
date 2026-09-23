import type { StaticTranslationKey } from "@fixr/i18n";

const routeNames: Record<string, StaticTranslationKey> = {
	home: "dashboard.nav.home",
	notifications: "dashboard.nav.notifications",
	logs: "dashboard.nav.logs",
	account: "dashboard.nav.profile",
	security: "dashboard.nav.security",
	"api-keys": "dashboard.nav.apiKeys",
	"service-orders": "dashboard.nav.serviceOrders",
	estimates: "dashboard.nav.estimates",
	suppliers: "dashboard.nav.suppliers",
	parts: "dashboard.nav.parts",
	inventory: "dashboard.nav.inventory",
	support: "dashboard.nav.support",
	customers: "dashboard.nav.customers",
	devices: "dashboard.nav.devices",
	employees: "dashboard.nav.employees",
};

/** Translation key naming the route, so the caller renders it in its language. */
export function getDashboardRouteName(pathname: string): StaticTranslationKey {
	const routes = pathname.split("/").filter(Boolean);
	const current = routes.at(-1) ?? "";

	return routeNames[current] ?? "common.app.name";
}
