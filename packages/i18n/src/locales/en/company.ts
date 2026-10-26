export const company = {
	page: {
		title: "Company",
		description: "Data shown on your estimates and other documents.",
	},
	sections: {
		identity: {
			title: "Identity",
			description: "How your shop shows up to customers and your team.",
		},
		contact: {
			title: "Contact",
			description: "Where customers find and reach you.",
		},
	},
	logo: {
		title: "Logo",
		description:
			"Shown in the dashboard sidebar for the whole team and printed on the header of your estimates.",
		pickHint: "Drag an image or click to pick one",
		upload: "Upload logo",
		replace: "Replace logo",
		remove: "Remove",
		alt: "Company logo",
		dialogTitle: "Company logo",
		stepSelect: "Pick an image of your logo.",
		stepCrop: "Adjust how your logo is framed.",
		stepUploading: "Saving...",
		saving: "Uploading your logo...",
		dropzoneTitle: "Upload your logo",
		dropzoneHint: "Drag it here or click to pick one",
		uploaded: "Logo updated.",
		removed: "Logo removed.",
		uploadError: "Could not upload the logo.",
	},
	form: {
		name: "Business name",
		nameDescription:
			"Shown at the top of your estimates, in the emails sent to customers and in the customer portal.",
		cnpj: "CNPJ",
		cnpjDescription:
			"Printed on your estimates. It was set when the company was registered and can't be changed.",
		address: "Address",
		addressDescription:
			"Where customers drop off and pick up their devices. Shown on estimates and in the customer portal.",
		addressPlaceholder: "Street, number, city - state",
		email: "Contact e-mail",
		emailDescription:
			"Where customers can reach the shop. Shown on estimates and in the customer portal.",
		emailPlaceholder: "contact@yourshop.com",
		phone: "Phone",
		phonePlaceholder: "(11) 3456-7890",
		phoneDescription:
			"Contact number shown on estimates and in the customer portal.",
		website: "Website",
		websiteDescription:
			"Optional. Your shop's website or social media page, shown on estimates and in the customer portal.",
		websitePlaceholder: "https://yourshop.com",
		save: "Save changes",
		discard: "Discard",
		saveHint: "Only administrators can change these details.",
	},
} as const;
