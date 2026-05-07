export const permissions = {
	account: {
		read: "account:read",
		update: "account:update",
		delete: "account:delete",
	},
	companies: {
		read: "companies:read",
		update: "companies:update",
	},
	logs: {
		read: "logs:read",
	},
	devices: {
		read: "devices:read",
		create: "devices:create",
		update: "devices:update",
		delete: "devices:delete",
	},
	employees: {
		read: "employees:read",
		create: "employees:create",
		update: "employees:update",
		delete: "employees:delete",
	},
	parts: {
		read: "parts:read",
		create: "parts:create",
		update: "parts:update",
		delete: "parts:delete",
	},
	serviceOrders: {
		read: "serviceOrders:read",
		create: "serviceOrders:create",
		update: "serviceOrders:update",
		delete: "serviceOrders:delete",
		changeStatus: "serviceOrders:changeStatus",
		assign: "serviceOrders:assign",
	},
	estimates: {
		read: "estimates:read",
		create: "estimates:create",
		update: "estimates:update",
		delete: "estimates:delete",
		sendToCustomer: "estimates:sendToCustomer",
	},
	customers: {
		read: "customers:read",
		create: "customers:create",
		update: "customers:update",
		delete: "customers:delete",
	},
	inventory: {
		read: "inventory:read",
		create: "inventory:create",
		update: "inventory:update",
		delete: "inventory:delete",
		adjust: "inventory:adjust",
	},
	suppliers: {
		read: "suppliers:read",
		create: "suppliers:create",
		update: "suppliers:update",
		delete: "suppliers:delete",
	},
	settings: {
		read: "settings:read",
		update: "settings:update",
		security: "settings:security",
	},
} as const;

type NestedValues<T> = T extends string
	? T
	: {
			[K in keyof T]: NestedValues<T[K]>;
		}[keyof T];

export type Permission = NestedValues<typeof permissions>;
