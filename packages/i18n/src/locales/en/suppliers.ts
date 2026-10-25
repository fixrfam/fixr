export const suppliers = {
	page: {
		title: "Suppliers",
		description: "Manage the suppliers of your shop's parts",
		newTitle: "Register supplier",
		newDescription: "Fill in the fields below to register a new supplier.",
	},
	table: {
		search: "Search by name, CNPJ or contact...",
		create: "New supplier",
		headers: {
			name: "Name",
			cnpj: "CNPJ",
			contact: "Contact",
			phone: "Phone",
			email: "Email",
			partsCount: "Parts",
		},
	},
	form: {
		nameLabel: "Name",
		namePlaceholder: "TechParts Distribution",
		cnpjLabel: "CNPJ",
		contactLabel: "Contact",
		contactPlaceholder: "Person in charge",
		phoneLabel: "Phone",
		emailLabel: "Email",
		emailPlaceholder: "sales@supplier.com",
		submit: "Register supplier",
		created: "Supplier registered successfully!",
	},
} as const;
