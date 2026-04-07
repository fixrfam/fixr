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

	{
		path: "/dashboard/:subdomain",
		permission: permissions.companies.read,
	},
	{
		path: "/dashboard/:subdomain/home",
		permission: permissions.serviceOrders.read,
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
		path: "/dashboard/:subdomain/invoices",
		permission: permissions.invoices.read,
	},
	{
		path: "/dashboard/:subdomain/invoices/new",
		permission: permissions.invoices.create,
	},
	{
		path: "/dashboard/:subdomain/invoices/:id",
		permission: permissions.invoices.read,
	},

	{
		path: "/dashboard/:subdomain/inventory",
		permission: permissions.inventory.read,
	},
	{
		path: "/dashboard/:subdomain/inventory/new",
		permission: permissions.inventory.create,
	},
	{
		path: "/dashboard/:subdomain/inventory/:id",
		permission: permissions.inventory.read,
	},

	{
		path: "/dashboard/:subdomain/parts",
		permission: permissions.inventory.read,
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
];
