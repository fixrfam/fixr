export const sectors = {
	page: {
		title: "Sectors",
		description:
			"The teams of your shop, who is in each one and who owns each stage of a service order",
	},
	list: {
		title: "Sectors",
		description:
			'Each employee belongs to one sector: its pool is their "My sector".',
		empty: "No sectors yet. Create the first one, like Front desk or Bench.",
		newPlaceholder: "New sector name",
		create: "Create sector",
		created: "Sector created!",
		rename: "Rename",
		renamed: "Sector renamed!",
		remove: "Delete",
		removeTitle: "Delete {{name}}?",
		removeDescription:
			"Its employees and orders are left without a sector, and the stages it owned lose their default sector.",
		removed: "Sector deleted!",
		employees_one: "{{count}} employee",
		employees_other: "{{count}} employees",
		noEmployees: "Nobody in this sector",
	},
	members: {
		title: "Employees",
		description: "Move each employee to their sector.",
		sector: "Sector",
		none: "No sector",
		moved: "{{name}} moved!",
	},
	stages: {
		title: "Stage owners",
		description:
			"When an order enters a stage it goes to that sector's pool and, if set, to that employee. Leave both empty to keep it with whoever has it.",
		stage: "Stage",
		sector: "Sector",
		employee: "Employee",
		noSector: "Keep the sector",
		noEmployee: "Sector pool",
		saved: "Stage owners saved!",
	},
} as const;
