export const home = {
	nav: {
		features: "Features",
		products: "Products",
		pricing: "Pricing",
		customers: "Customers",
		contact: "Contact",
		docs: "Docs",
	},
	hero: {
		badge: "Simplify and grow",
		/** Animated one piece at a time, so the headline is split by word group. */
		titleFirst: "The",
		titleHighlight: "easy",
		titleMiddle: "way to manage your",
		titleEnd: "repair shop",
		subtitle:
			"Bring your service orders, inventory control and repair tracking together in one place.",
		cta: "Open Fixr",
		docs: "Documentation",
	},
	features: {
		badge: "Simple & intuitive",
		titleBefore: "Your",
		titleWork: "work",
		titleBetween: ", made",
		titleEasier: "easier",
		description:
			"Fixr smooths the workflow across every corner of your repair shop.",
	},
	footer: {
		builtByBefore: "Built by the",
		builtByAfter: "team as an academic project at",
		codeAvailable: "Code available on",
		privacy: "Privacy Policy",
		terms: "Terms of Use",
	},
	banner: {
		apiDown: "API unavailable",
		learnMore: "Learn more",
	},
	downtime: {
		title: "The system is temporarily offline",
		bannerAlt: "Fixr banner",
		project:
			"This is an interdisciplinary project built at FAM (Faculdade das Américas). Its infrastructure spans several services: the API server, the database and the cache system, all hosted on a private VPS.",
		costs:
			"Since those services are billed in dollars, we keep them up only around the presentation window of the integrated projects (PIs).",
		outside:
			"Outside those windows the backend is switched off to cut running costs, and only the frontend stays reachable for demos and visual reference.",
		learn:
			"If you want to know more about how the project works, its architecture and main technical decisions, you can read the documentation or explore the other links.",
		linktree: "Linktree",
		docs: "Documentation",
		thanks: "Thank you for your understanding and interest in the project.",
		signature: "Sincerely, the Fixr team.",
	},
	legal: {
		back: "Back to the start",
		badge: "Legal terms",
		updatedAt: "Last updated on: {{date}}",
	},
} as const;
