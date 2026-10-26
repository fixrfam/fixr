/** Copy of the customers' devices (Devices > Customer devices). */
export const devices = {
	page: {
		title: "Customer devices",
		description:
			"Every device your customers own, and where each one is right now.",
	},
	status: {
		in_shop: "In the shop",
		ready_for_pickup: "Ready for pickup",
		with_customer: "With the customer",
	},
	table: {
		search: "Search by model, brand, owner, IMEI or serial number...",
		create: "New device",
		allStatuses: "All statuses",
		statusFilter: "Status",
		headers: {
			device: "Device",
			owner: "Owner",
			identifiers: "IMEI / serial",
			status: "Status",
			updatedAt: "Updated",
			actions: "Actions",
		},
		noIdentifiers: "Not recorded",
	},
	form: {
		createTitle: "New device",
		createDescription: "Register a device of one of your customers.",
		editTitle: "Edit device",
		editDescription: "Change the device's model, identifiers, notes or status.",
		customerLabel: "Owner",
		customerPlaceholder: "Search a customer by name or CPF",
		customerEmpty: "No customer found.",
		modelLabel: "Model",
		modelPlaceholder: "Search the catalog",
		modelEmpty: "No model found.",
		imeiLabel: "IMEI",
		imeiPlaceholder: "356938035643809",
		serialNumberLabel: "Serial number",
		serialNumberPlaceholder: "C02XK0AAJG5H",
		notesLabel: "Notes",
		notesPlaceholder: "Scratches, accessories left with the device...",
		statusLabel: "Where it is",
		create: "Register device",
		save: "Save changes",
		created: "Device registered!",
		updated: "Device updated!",
	},
	actions: {
		edit: "Edit",
		delete: "Delete",
		openServiceOrder: "Open service order",
		menu: "Device actions",
	},
	delete: {
		title: "Delete this device?",
		description:
			"It leaves the list, but its service orders keep pointing to it.",
		confirm: "Delete",
		cancel: "Cancel",
		deleted: "Device deleted.",
	},
	detail: {
		empty: "This customer has no devices yet.",
	},
} as const;
