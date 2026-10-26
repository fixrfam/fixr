export const home = {
	nav: {
		label: "Main",
		overview: "Overview",
		showSections: "Show page sections",
		features: "Features",
		howItWorks: "How it works",
		roles: "Roles",
		faq: "FAQ",
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
		scene:
			"The Fixr dashboard showing a service order with its device details, lifecycle, summary, technician and client data",
		proof: {
			openSource: "Open source",
			interviews: "Shaped with repair shop owners",
			languages: "Portuguese and English",
		},
	},
	/** Content of the dashboard drawn in the hero. Labels come from the dashboard catalogs. */
	preview: {
		title: "Service order",
		description: "See the full details of the service order below",
		issue: "Battery drains fast and overheats.",
		entryRegistered: "Service order registered by the technician.",
		entryDiagnosis: "Diagnosis done, the battery needs replacing.",
		entryWaiting: "Waiting for the new battery to arrive.",
		notes: "Diagnosis done, waiting for the new battery to arrive.",
		category: "Phones",
		part: "Battery",
		caption: "Swollen phone battery",
	},
	problem: {
		badge: "Why Fixr",
		titleBefore: "From paper slips to",
		titleHighlight: "one system",
		description:
			"Most repair shops still run on carbon copy forms, a stock notebook and estimates sent through chat. Fixr puts every step in the same place.",
		scene: "Loose paper slips flying in and stacking into a single Fixr record",
		solution: "With Fixr, each repair keeps one record from intake to pickup.",
		pains: {
			lost: {
				title: "Lost service orders",
				description:
					"A paper slip goes missing and nobody knows which phone belongs to whom.",
			},
			estimates: {
				title: "Estimates nobody can find",
				description:
					"Prices live in chat threads, so approvals get lost and repairs stall on the bench.",
			},
			stock: {
				title: "Stock you have to guess",
				description:
					"You only learn a part is gone when the technician opens the drawer.",
			},
			calls: {
				title: "Customers calling for updates",
				description:
					"Every call asking if the phone is ready pulls someone away from a repair.",
			},
		},
	},
	features: {
		badge: "Simple & intuitive",
		titleBefore: "Your",
		titleWork: "work",
		titleBetween: ", made",
		titleEasier: "easier",
		description:
			"Fixr smooths the workflow across every corner of your repair shop.",
		cards: {
			serviceOrders: {
				title: "Service orders that move",
				description:
					"Open an order at the counter, assign a technician and follow it from open to done on one board.",
				scene:
					"Service order cards moving across open, in progress and done lanes",
			},
			estimates: {
				title: "Estimates approved by link",
				description:
					"Build the estimate from the parts and services on the order, send the PDF and let the customer approve it online.",
				scene:
					"An estimate filling in line by line before an approval stamp lands on it",
			},
			portal: {
				title: "A portal for your customers",
				description:
					"Customers open the link in their email and check the repair status without calling the shop.",
				scene:
					"A phone showing a repair moving through its statuses, with a new notification",
			},
			inventory: {
				title: "Stock that warns you first",
				description:
					"Parts used on an order leave inventory on their own, and each one points to the suppliers you buy it from.",
				scene:
					"Parts shelves where an empty slot is refilled by a box from the supplier",
			},
			catalog: {
				title: "A device catalog ready to use",
				description:
					"Phones, tablets, smartwatches and notebooks come with makers and specs filled in, so intake takes seconds.",
				scene:
					"A notebook, a phone and a tablet floating over the device catalog",
			},
		},
		extras: {
			notifications: {
				title: "Automatic emails",
				description:
					"Customers hear about status changes and estimate answers in their inbox.",
			},
			history: {
				title: "Full order history",
				description:
					"See who changed each order, when, and which technician took it over.",
			},
			api: {
				title: "API keys",
				description:
					"Connect your own tools with keys that never reach past the creator's role.",
			},
		},
	},
	tagline: {
		/** Words wrapped in asterisks are highlighted in the brand color. */
		lineOne: "Every repair gets *one record*,",
		lineTwo: "from the counter to the moment *it goes home*.",
	},
	howItWorks: {
		badge: "How it works",
		titleBefore: "Three steps,",
		titleHighlight: "zero paper",
		description:
			"The same flow your shop already follows, without the forms and the follow up calls.",
		step: "Step {{number}}",
		steps: {
			intake: {
				title: "Open the order at the counter",
				description:
					"Register the customer and pick the device from the catalog. The order gets a number and a technician.",
			},
			estimate: {
				title: "Diagnose and send the estimate",
				description:
					"The technician adds parts and services. Fixr checks the stock and builds the PDF for the customer.",
			},
			deliver: {
				title: "Approve, repair and notify",
				description:
					"The customer approves by link, the team gets to work, and every status change reaches their inbox.",
			},
		},
	},
	roles: {
		badge: "Access by role",
		titleBefore: "Each person sees",
		titleHighlight: "only what they need",
		description:
			"Five roles come ready, each one limited to the work it does. Counter, bench, stock and finance share one system without stepping on each other.",
		scene:
			"Five stacked access layers, with the selected role lifted and highlighted",
		pick: "Pick a role to see what it can do",
		items: {
			technician:
				"Works service orders, updates their status and checks parts and devices.",
			warehouse:
				"Adjusts inventory, registers parts and keeps suppliers up to date.",
			financial: "Creates estimates, edits prices and sends them to customers.",
			manager:
				"Opens and assigns orders, and manages customers, stock and estimates.",
			admin: "Full access, including employees, roles and company settings.",
		},
	},
	proof: {
		badge: "Built from the trade",
		titleBefore: "Made with",
		titleHighlight: "repair shops",
		description:
			"Fixr started from interviews with owners and technicians of small and medium repair shops. Every screen follows how they actually work.",
		points: {
			interviews: {
				title: "Shaped by real shops",
				description:
					"Requirements came from conversations with people who fix devices every day.",
			},
			isolation: {
				title: "Your shop, your data",
				description:
					"Each shop runs in its own space, and its records never mix with anyone else's.",
			},
			openSource: {
				title: "Open source",
				description:
					"The code is public on GitHub, so you can see exactly how your data is handled.",
			},
		},
		github: "See the code on GitHub",
	},
	faq: {
		badge: "Questions",
		titleBefore: "Frequently asked",
		titleHighlight: "questions",
		items: {
			install: {
				question: "Do I need to install anything?",
				answer:
					"No. Fixr runs in the browser on computers, tablets and phones, and each shop gets its own space with its own team.",
			},
			approval: {
				question: "How does the customer approve an estimate?",
				answer:
					"They receive an email with a link, open the estimate as a PDF and approve or decline it. The answer reaches the service order right away.",
			},
			tracking: {
				question: "Can my customers follow the repair?",
				answer:
					"Yes. The same link opens a portal where they confirm their identity and see the status and history of their orders.",
			},
			roles: {
				question: "Can I limit what each employee sees?",
				answer:
					"Yes. Technician, warehouse, finance, manager and administrator come ready, and each role only reaches the screens it needs.",
			},
			stock: {
				question: "Does Fixr control my stock?",
				answer:
					"Yes. Parts used on a service order leave inventory automatically, and each part links to the suppliers you buy it from.",
			},
			catalog: {
				question: "Do I have to register every device model?",
				answer:
					"No. Fixr ships with a catalog of phones, tablets, smartwatches and notebooks, with makers and specs already filled in.",
			},
			invoices: {
				question: "Does Fixr issue invoices?",
				answer:
					"Not yet. Invoice issuing is under study, and service orders and estimates already keep the data it will need.",
			},
			pricing: {
				question: "How much does Fixr cost?",
				answer:
					"Plans are still being defined. Meanwhile the code is open on GitHub, so you can see everything Fixr does before deciding.",
			},
			language: {
				question: "Is Fixr available in English?",
				answer:
					"Yes. The whole app works in Portuguese and English, and you can switch languages at any time.",
			},
			integrations: {
				question: "Can I connect Fixr to other tools?",
				answer:
					"Yes. Each employee can create API keys, and a key never carries more access than the role of the person who created it.",
			},
		},
	},
	cta: {
		titleBefore: "Ready to run your shop",
		titleHighlight: "in one place?",
		description:
			"Open Fixr, register your first service order and see the whole repair flow in a few minutes.",
		reassurance: "No installation. Runs in the browser. Open source.",
		scene: "The Fixr logo as a floating block with small parts orbiting it",
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
