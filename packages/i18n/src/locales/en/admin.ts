/** Internal admin panel (`apps/admin`). */
export const admin = {
	metadata: {
		title: "Fixr Admin",
		description: "Admin panel",
	},
	landing: {
		title: "Admin panel",
		description:
			"Create companies and admins, and configure our customers' businesses.",
		restricted: "Access restricted to developers",
		dashboard: "Dashboard",
	},
	breadcrumb: {
		root: "Fixr",
		current: "Admin",
	},
	nav: {
		companies: "Companies",
		list: "List",
		new: "New",
		plan: "Enterprise",
		platform: "Platform",
		teams: "Teams",
		addTeam: "Add team",
	},
	dashboard: {
		title: "Fixr - Admin",
		description: "Admin panel",
		newCompany: "Create a new company",
		listCompanies: "See companies",
	},
	companies: {
		newTitle: "Create a new company",
		newDescription:
			"Here you can create a new company and set up its default admin.",
		listPlaceholder: "Create a new company.",
	},
	createCompany: {
		nameLabel: "Company name *",
		namePlaceholder: "Acme Inc.",
		nameDescription: "Such as the company's trade name.",
		documentLabel: "CNPJ *",
		documentPlaceholder: "12.345.678/0001-00",
		subdomainLabel: "Subdomain",
		subdomainPlaceholder: "example",
		subdomainDescription: "Domain - {{subdomain}}.fixr.ricardo.gg",
		subdomainFallback: "example",
		ownerEmailLabel: "Owner email *",
		ownerEmailPlaceholder: "email@example.com",
		ownerEmailDescription:
			"They will get their (resettable) access password at this address.",
		ownerDocumentLabel: "Owner CPF *",
		ownerDocumentPlaceholder: "123.456.789-00",
		ownerPasswordLabel: "Owner password *",
		ownerPasswordDescription: "It will be sent to the email above.",
		generate: "Generate",
		optionalFields: "Optional fields",
		addressLabel: "Address",
		addressPlaceholder: "1234 Main St",
		submit: "Create",
	},
} as const;
