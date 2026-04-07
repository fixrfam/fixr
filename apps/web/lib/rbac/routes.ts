import { permissions } from "@fixr/permissions";
import type { Permission } from "@fixr/permissions";
import type { EmployeeRole } from "@fixr/permissions";

export type RouteRule = {
  path: string;
  permission?: Permission;
  roles?: readonly EmployeeRole[];
  public?: boolean;
};

export const routeRules: RouteRule[] = [
  // Public routes (no auth required)
  { path: "/auth/login", public: true },
  { path: "/auth/forgot-password", public: true },
  { path: "/auth/forgot-password/:token", public: true },
  { path: "/api/auth/signout", public: true },

  // Root and downtime
  { path: "/", public: true },
  { path: "/downtime", public: true },

  // Dashboard - any authenticated user with company access
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

  // Employees (admin/manager)
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

  // Service Orders
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

  // Customers
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

  // Estimates
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

  // Invoices
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

  // Inventory
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

  // Parts (alias for inventory)
  {
    path: "/dashboard/:subdomain/parts",
    permission: permissions.inventory.read,
  },

  // Suppliers
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

  // Devices
  {
    path: "/dashboard/:subdomain/devices",
    permission: permissions.customers.read,
  },

  // Settings
  {
    path: "/dashboard/:subdomain/settings",
    permission: permissions.settings.read,
  },
  {
    path: "/dashboard/:subdomain/settings/security",
    permission: permissions.settings.security,
  },

  // Support
  {
    path: "/dashboard/:subdomain/support",
    public: true,
  },

  // Logs
  {
    path: "/dashboard/:subdomain/logs",
    permission: permissions.settings.read,
  },

  // Notifications
  {
    path: "/dashboard/:subdomain/notifications",
    permission: permissions.companies.read,
  },
];
