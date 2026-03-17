export const permissions = {
	auth: {
		login: "auth:login",
		register: "auth:register",
	},
	companies: {
		read: "companies:read",
		update: "companies:update",
	},
	employees: {
		read: "employees:read",
		create: "employees:create",
		update: "employees:update",
		delete: "employees:delete",
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
	invoices: {
		read: "invoices:read",
		create: "invoices:create",
		generate: "invoices:generate",
		send: "invoices:send",
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
	clientPortal: {
		readOwnDevices: "clientPortal:readOwnDevices",
		readOwnServiceOrders: "clientPortal:readOwnServiceOrders",
		readOwnInvoices: "clientPortal:readOwnInvoices",
	},
} as const;

export type Permission =
	| "auth:login"
	| "auth:register"
	| "companies:read"
	| "companies:update"
	| "employees:read"
	| "employees:create"
	| "employees:update"
	| "employees:delete"
	| "serviceOrders:read"
	| "serviceOrders:create"
	| "serviceOrders:update"
	| "serviceOrders:delete"
	| "serviceOrders:changeStatus"
	| "serviceOrders:assign"
	| "estimates:read"
	| "estimates:create"
	| "estimates:update"
	| "estimates:delete"
	| "estimates:sendToCustomer"
	| "invoices:read"
	| "invoices:create"
	| "invoices:generate"
	| "invoices:send"
	| "customers:read"
	| "customers:create"
	| "customers:update"
	| "customers:delete"
	| "inventory:read"
	| "inventory:create"
	| "inventory:update"
	| "inventory:delete"
	| "inventory:adjust"
	| "suppliers:read"
	| "suppliers:create"
	| "suppliers:update"
	| "suppliers:delete"
	| "settings:read"
	| "settings:update"
	| "settings:security"
	| "clientPortal:readOwnDevices"
	| "clientPortal:readOwnServiceOrders"
	| "clientPortal:readOwnInvoices";
