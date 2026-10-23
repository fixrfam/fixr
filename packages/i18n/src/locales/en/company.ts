export const company = {
	page: {
		title: "Company",
		description: "Data shown on your estimates and other documents.",
	},
	logo: {
		title: "Logo",
		description:
			"Printed on the header of your documents. PNG, JPG or WebP up to 5 MB.",
		upload: "Upload logo",
		replace: "Replace logo",
		remove: "Remove",
		alt: "Company logo",
		uploading: "Uploading...",
		tooLarge: "The logo must be at most 5 MB.",
	},
	form: {
		name: "Business name",
		cnpj: "CNPJ",
		cnpjDescription: "The CNPJ can't be changed.",
		address: "Address",
		addressPlaceholder: "Street, number, city - state",
		email: "Contact e-mail",
		emailPlaceholder: "contact@yourshop.com",
		phone: "Phone",
		website: "Website",
		websitePlaceholder: "https://yourshop.com",
		save: "Save changes",
	},
} as const;
