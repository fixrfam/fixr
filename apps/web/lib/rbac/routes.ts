import type { EmployeeRole, Permission } from "@fixr/permissions";
import { permissions } from "@fixr/permissions";

export interface RouteRule {
	path: string;
	permission?: Permission;
	roles?: readonly EmployeeRole[];
	public?: boolean;
}

export const routeRules: RouteRule[] = [
	{ path: "/auth/login", public: true },
	{ path: "/auth/forgot-password", public: true },
	{ path: "/auth/forgot-password/:token", public: true },
	{ path: "/api/auth/signout", public: true },

	{ path: "/", public: true },
	{ path: "/downtime", public: true },
	{ path: "/estimate/:token", public: true },
	{ path: "/portal", public: true },
	{ path: "/portal/access", public: true },
	{ path: "/portal/:token", public: true },
	{ path: "/portal/service-orders/:id", public: true },

	{
		path: "/dashboard/:subdomain/home",
		permission: permissions.companies.read,
	},
	{
		path: "/dashboard/:subdomain/account",
		permission: permissions.companies.read,
	},

	{
		path: "/dashboard/:subdomain/employees",
		permission: permissions.employees.read,
	},
	{
		path: "/dashboard/:subdomain/employees/new",
		permission: permissions.employees.create,
	},
	{
		path: "/dashboard/:subdomain/employees/:id",
		permission: permissions.employees.read,
	},

	{
		path: "/dashboard/:subdomain/service-orders",
		permission: permissions.serviceOrders.read,
	},
	{
		path: "/dashboard/:subdomain/service-orders/new",
		permission: permissions.serviceOrders.create,
	},
	{
		path: "/dashboard/:subdomain/service-orders/:id",
		permission: permissions.serviceOrders.read,
	},

	{
		path: "/dashboard/:subdomain/customers",
		permission: permissions.customers.read,
	},
	{
		path: "/dashboard/:subdomain/customers/new",
		permission: permissions.customers.create,
	},
	{
		path: "/dashboard/:subdomain/customers/:id",
		permission: permissions.customers.read,
	},

	{
		path: "/dashboard/:subdomain/estimates",
		permission: permissions.estimates.read,
	},
	{
		path: "/dashboard/:subdomain/estimates/new",
		permission: permissions.estimates.create,
	},
	{
		path: "/dashboard/:subdomain/estimates/:id",
		permission: permissions.estimates.read,
	},

	{
		path: "/dashboard/:subdomain/inventory",
		permission: permissions.inventory.read,
	},
	{
		path: "/dashboard/:subdomain/inventory/new",
		permission: permissions.inventory.adjust,
	},
	{
		path: "/dashboard/:subdomain/inventory/:id",
		permission: permissions.inventory.read,
	},

	// Specific routes first: a rule also matches every path below it
	{
		path: "/dashboard/:subdomain/parts/new",
		permission: permissions.parts.create,
	},
	{
		path: "/dashboard/:subdomain/parts/:id/edit",
		permission: permissions.parts.update,
	},
	{
		path: "/dashboard/:subdomain/parts",
		permission: permissions.parts.read,
	},

	{
		path: "/dashboard/:subdomain/services/new",
		permission: permissions.services.create,
	},
	{
		path: "/dashboard/:subdomain/services/:id/edit",
		permission: permissions.services.update,
	},
	{
		path: "/dashboard/:subdomain/services",
		permission: permissions.services.read,
	},

	{
		path: "/dashboard/:subdomain/suppliers",
		permission: permissions.suppliers.read,
	},
	{
		path: "/dashboard/:subdomain/suppliers/new",
		permission: permissions.suppliers.create,
	},
	{
		path: "/dashboard/:subdomain/suppliers/:id",
		permission: permissions.suppliers.read,
	},

	{
		path: "/dashboard/:subdomain/devices",
		permission: permissions.customers.read,
	},

	{
		path: "/dashboard/:subdomain/settings/company",
		permission: permissions.companies.update,
	},
	{
		path: "/dashboard/:subdomain/settings",
		permission: permissions.settings.read,
	},
	{
		path: "/dashboard/:subdomain/settings/security",
		permission: permissions.settings.security,
	},

	{
		path: "/dashboard/:subdomain/support",
		public: true,
	},

	{
		path: "/dashboard/:subdomain/logs",
		permission: permissions.settings.read,
	},
	{
		path: "/dashboard/:subdomain/notifications",
		permission: permissions.companies.read,
	},
	// Catch-all: must be last so more specific routes match first
	{
		path: "/dashboard/:subdomain",
		permission: permissions.companies.read,
	},
];
