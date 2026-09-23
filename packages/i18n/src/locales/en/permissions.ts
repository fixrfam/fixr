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
} as const;
