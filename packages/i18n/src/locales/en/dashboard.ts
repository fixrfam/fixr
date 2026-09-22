export const dashboard = {
	metadata: {
		title: "Fixr - Dashboard",
	},
	sidebar: {
		myCompany: "My company",
		quickAccess: "Quick access",
		sections: {
			system: "System",
			modules: "Modules",
			company: "Company",
		},
	},
	nav: {
		home: "Home",
		notifications: "Notifications",
		logs: "Logs",
		settings: "Settings",
		profile: "Profile",
		security: "Security",
		apiKeys: "API keys",
		serviceOrders: "Service orders",
		estimates: "Estimates",
		suppliers: "Suppliers",
		parts: "Parts",
		inventory: "Inventory",
		support: "Support",
		customers: "Customers",
		devices: "Devices",
		employees: "Employees",
	},
	account: {
		manage: "Manage",
		title: "Profile",
		description: "Manage your account settings.",
	},
	home: {
		title: "Home",
		description: "Welcome to your dashboard!",
	},
	notFound: {
		title: "Coming soon!",
		description: "This feature is still under construction.",
		hint: "We are working to ship news as soon as possible. Thanks for your patience!",
	},
} as const;
