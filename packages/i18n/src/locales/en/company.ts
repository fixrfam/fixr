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
		dialogTitle: "Company logo",
		stepSelect: "Pick an image of your logo.",
		stepCrop: "Adjust how your logo is framed.",
		stepUploading: "Saving...",
		saving: "Uploading your logo...",
		dropzoneTitle: "Drag your logo here or click to pick one",
		dropzoneHint: "PNG, JPG or WebP. Up to 5MB.",
		uploaded: "Logo ready. Save the changes to apply it.",
		uploadError: "Could not upload the logo.",
	},
	form: {
		name: "Business name",
		nameDescription:
			"Shown at the top of your estimates, in the emails sent to clients and in the client portal.",
		cnpj: "CNPJ",
		cnpjDescription:
			"Printed on your estimates. It was set when the company was registered and can't be changed.",
		address: "Address",
		addressDescription:
			"Where clients drop off and pick up their devices. Shown on estimates and in the client portal.",
		addressPlaceholder: "Street, number, city - state",
		email: "Contact e-mail",
		emailDescription:
			"Where clients can reach the shop. Shown on estimates and in the client portal.",
		emailPlaceholder: "contact@yourshop.com",
		phone: "Phone",
		phoneDescription:
			"Contact number shown on estimates and in the client portal.",
		website: "Website",
		websiteDescription:
			"Optional. Your shop's website or social media page, shown on estimates and in the client portal.",
		websitePlaceholder: "https://yourshop.com",
		save: "Save changes",
	},
} as const;
