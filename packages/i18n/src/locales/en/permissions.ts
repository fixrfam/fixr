/**
 * Names for the two halves of a permission string ("serviceOrders:read"),
 * used by the API key scope picker.
 */
export const permissions = {
	resources: {
		account: "Account",
		apiKeys: "API keys",
		companies: "Company",
		customers: "Customers",
		devices: "Devices",
		employees: "Employees",
		estimates: "Estimates",
		inventory: "Inventory",
		logs: "Logs",
		parts: "Parts",
		serviceOrders: "Service orders",
		services: "Services",
		settings: "Settings",
		suppliers: "Suppliers",
	},
	actions: {
		adjust: "Adjust",
		assign: "Assign",
		changeStatus: "Change status",
		create: "Create",
		delete: "Delete",
		read: "Read",
		revoke: "Revoke",
		security: "Security",
		sendToCustomer: "Send to customer",
		update: "Edit",
	},
	matrix: {
		title: "Roles and permissions",
		description:
			"What each role can do in the company. These are the default permissions every employee gets from their role.",
		permission: "Permission",
		allowed: "Allowed",
		notAllowed: "Not allowed",
		yourRole: "Your role",
		count_one: "{{count}} permission",
		count_other: "{{count}} permissions",
	},
	roleDescriptions: {
		guest: "No access until an administrator assigns a role.",
		technician:
			"Works on service orders and looks up the parts and services catalog.",
		warehouse: "Manages parts, suppliers and stock adjustments.",
		financial: "Builds, prices and sends estimates to customers.",
		manager:
			"Runs the day to day: service orders, customers, catalog, estimates and new employees.",
		admin: "Full access, including deleting records and managing the company.",
	},
} as const;
