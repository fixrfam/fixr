/**
 * Deterministic demo data for local development (`bun run db:seed`).
 * Every account shares {@link SEED_PASSWORD}. Emails use the `.dev` TLD so
 * they never collide with the e2e fixtures (`.test`).
 */
export const SEED_PASSWORD = "Fixr!Dev123";

export type SeedRole =
	| "admin"
	| "manager"
	| "technician"
	| "warehouse"
	| "financial"
	| "guest";

interface SeedEmployee {
	role: SeedRole;
	name: string;
	email: string;
}

interface SeedCompany {
	name: string;
	subdomain: string;
	address: string;
	employees: SeedEmployee[];
}

export const COMPANIES: SeedCompany[] = [
	{
		name: "Assistência Alfa",
		subdomain: "alfa",
		address: "Rua das Flores, 123, São Paulo - SP",
		employees: [
			{ role: "admin", name: "Ana Admin", email: "admin@alfa.dev" },
			{ role: "manager", name: "Marcos Gerente", email: "manager@alfa.dev" },
			{
				role: "technician",
				name: "Tiago Técnico",
				email: "technician@alfa.dev",
			},
			{
				role: "technician",
				name: "Taís Técnica",
				email: "technician2@alfa.dev",
			},
			{
				role: "warehouse",
				name: "Wagner Estoque",
				email: "warehouse@alfa.dev",
			},
			{
				role: "financial",
				name: "Fernanda Financeiro",
				email: "financial@alfa.dev",
			},
			{ role: "guest", name: "Gabriel Visitante", email: "guest@alfa.dev" },
		],
	},
	{
		name: "Assistência Beta",
		subdomain: "beta",
		address: "Av. Brasil, 456, Rio de Janeiro - RJ",
		employees: [
			{ role: "admin", name: "Bruno Admin", email: "admin@beta.dev" },
			{
				role: "technician",
				name: "Bianca Técnica",
				email: "technician@beta.dev",
			},
		],
	},
];

export const CLIENTS = [
	{
		name: "Carla Souza",
		email: "carla@cliente.dev",
		phone: "11987654321",
		address: "Rua Augusta, 1500",
		city: "São Paulo",
		state: "SP",
	},
	{
		name: "Diego Lima",
		email: "diego@cliente.dev",
		phone: "11976543210",
		address: "Avenida Paulista, 900",
		city: "São Paulo",
		state: "SP",
	},
	{
		name: "Eduarda Rocha",
		email: "eduarda@cliente.dev",
		phone: "21965432109",
		address: "Rua Voluntários da Pátria, 45",
		city: "Rio de Janeiro",
		state: "RJ",
	},
	{
		name: "Felipe Alves",
		email: "felipe@cliente.dev",
		phone: "21954321098",
		address: "Rua das Laranjeiras, 210",
		city: "Rio de Janeiro",
		state: "RJ",
	},
	{
		name: "Helena Costa",
		email: "helena@cliente.dev",
		phone: "31943210987",
		address: "Avenida Afonso Pena, 3000",
		city: "Belo Horizonte",
		state: "MG",
	},
];

export const CATEGORIES = [
	{ name: "Smartphone", slug: "smartphone" },
	{ name: "Tablet", slug: "tablet" },
	{ name: "Notebook", slug: "notebook" },
];

export const MAKERS = [
	{
		name: "Apple",
		slug: "apple",
		models: [
			{ name: "iPhone 13", category: "smartphone" },
			{ name: "iPhone 15 Pro", category: "smartphone" },
			{ name: "iPad Air (5th gen)", category: "tablet" },
			{ name: "MacBook Air M2", category: "notebook" },
		],
	},
	{
		name: "Samsung",
		slug: "samsung",
		models: [
			{ name: "Galaxy S23", category: "smartphone" },
			{ name: "Galaxy A54", category: "smartphone" },
			{ name: "Galaxy Tab S9", category: "tablet" },
		],
	},
	{
		name: "Motorola",
		slug: "motorola",
		models: [
			{ name: "Moto G84", category: "smartphone" },
			{ name: "Edge 40", category: "smartphone" },
		],
	},
	{
		name: "Xiaomi",
		slug: "xiaomi",
		models: [
			{ name: "Redmi Note 13", category: "smartphone" },
			{ name: "Poco X6", category: "smartphone" },
		],
	},
	{
		name: "Lenovo",
		slug: "lenovo",
		models: [
			{ name: "IdeaPad 3", category: "notebook" },
			{ name: "Tab M10", category: "tablet" },
		],
	},
];

type OrderStatus =
	| "pending"
	| "diagnosing"
	| "waiting_approval"
	| "approved"
	| "fixing"
	| "ready"
	| "delivered";

interface SeedOrder {
	company: string;
	client: number;
	technician: string;
	maker: string;
	model: string;
	defect: string;
	observations?: string;
	status: OrderStatus;
	daysAgo: number;
}

/** `client` is an index into {@link CLIENTS}, `technician` an employee email. */
export const SERVICE_ORDERS: SeedOrder[] = [
	{
		company: "alfa",
		client: 0,
		technician: "technician@alfa.dev",
		maker: "apple",
		model: "iPhone 13",
		defect: "Tela trincada após queda, touch falhando no canto superior.",
		status: "pending",
		daysAgo: 0,
	},
	{
		company: "alfa",
		client: 1,
		technician: "technician@alfa.dev",
		maker: "samsung",
		model: "Galaxy S23",
		defect: "Não carrega, conector parece oxidado.",
		status: "diagnosing",
		daysAgo: 1,
	},
	{
		company: "alfa",
		client: 2,
		technician: "technician2@alfa.dev",
		maker: "motorola",
		model: "Moto G84",
		defect: "Bateria descarrega em poucas horas.",
		observations: "Cliente pediu orçamento antes de qualquer troca.",
		status: "waiting_approval",
		daysAgo: 2,
	},
	{
		company: "alfa",
		client: 3,
		technician: "technician@alfa.dev",
		maker: "apple",
		model: "MacBook Air M2",
		defect: "Teclado com teclas falhando após contato com líquido.",
		status: "approved",
		daysAgo: 3,
	},
	{
		company: "alfa",
		client: 4,
		technician: "technician2@alfa.dev",
		maker: "xiaomi",
		model: "Redmi Note 13",
		defect: "Câmera traseira não foca.",
		status: "fixing",
		daysAgo: 4,
	},
	{
		company: "alfa",
		client: 0,
		technician: "technician@alfa.dev",
		maker: "samsung",
		model: "Galaxy Tab S9",
		defect: "Alto-falante sem som.",
		status: "ready",
		daysAgo: 6,
	},
	{
		company: "alfa",
		client: 1,
		technician: "technician2@alfa.dev",
		maker: "lenovo",
		model: "IdeaPad 3",
		defect: "Superaquecendo e desligando sozinho.",
		observations: "Limpeza interna e troca de pasta térmica.",
		status: "delivered",
		daysAgo: 12,
	},
	{
		company: "alfa",
		client: 2,
		technician: "technician@alfa.dev",
		maker: "apple",
		model: "iPhone 15 Pro",
		defect: "Face ID parou de funcionar.",
		status: "delivered",
		daysAgo: 20,
	},
	{
		company: "beta",
		client: 3,
		technician: "technician@beta.dev",
		maker: "motorola",
		model: "Edge 40",
		defect: "Tela com manchas verdes.",
		status: "diagnosing",
		daysAgo: 1,
	},
	{
		company: "beta",
		client: 4,
		technician: "technician@beta.dev",
		maker: "xiaomi",
		model: "Poco X6",
		defect: "Wi-Fi não conecta.",
		status: "ready",
		daysAgo: 5,
	},
];

/** Inventory seeded for every company: suppliers, the parts they sell and the services that use them. */
export const SUPPLIERS = [
	{
		key: "techparts",
		name: "TechParts Distribuidora",
		contact: "Renata Albuquerque",
		phone: "1134567890",
		email: "vendas@techparts.com.br",
	},
	{
		key: "cellfix",
		name: "CellFix Importados",
		contact: "Marcos Tavares",
		phone: "11987654321",
		email: "comercial@cellfix.com.br",
	},
];

export const PARTS = [
	{
		key: "screen-ip13",
		sku: "TEL-IP13-OLED",
		name: "Tela OLED iPhone 13",
		category: "Telas e displays",
		costPrice: 480,
		salePrice: 890,
		stock: 6,
		minStock: 3,
		supplier: "cellfix",
	},
	{
		key: "screen-s22",
		sku: "TEL-S22-AMOLED",
		name: "Tela AMOLED Galaxy S22",
		category: "Telas e displays",
		costPrice: 620,
		salePrice: 1090,
		stock: 2,
		minStock: 3,
		supplier: "cellfix",
	},
	{
		key: "battery-ip11",
		sku: "BAT-IP11",
		name: "Bateria iPhone 11",
		category: "Baterias",
		costPrice: 90,
		salePrice: 220,
		stock: 12,
		minStock: 4,
		supplier: "techparts",
	},
	{
		key: "usbc-connector",
		sku: "CON-USBC-GEN",
		name: "Conector de carga USB-C",
		category: "Conectores",
		costPrice: 15,
		salePrice: 60,
		stock: 30,
		minStock: 10,
		supplier: "techparts",
	},
];

export const SERVICES = [
	{
		name: "Troca de tela",
		description: "Substituição do display e teste de toque, brilho e sensores.",
		estimatedDurationMinutes: 60,
		price: 150,
		parts: ["screen-ip13", "screen-s22"],
		deviceCategories: ["Telefonia"],
		testInstructions: [
			"Testar o toque em toda a área da tela",
			"Verificar brilho mínimo e máximo",
		],
		testParameters: ["Teste de toque: grade completa sem falhas"],
	},
	{
		name: "Troca de bateria",
		description: "Substituição da bateria e calibração do indicador de carga.",
		estimatedDurationMinutes: 40,
		price: 90,
		parts: ["battery-ip11"],
		deviceCategories: ["Telefonia"],
		testInstructions: ["Carregar até 100% e conferir o ciclo"],
		testParameters: ["Saúde da bateria acima de 95%"],
	},
	{
		name: "Troca de conector de carga",
		description: "Substituição do conector USB-C e limpeza da placa.",
		estimatedDurationMinutes: 50,
		price: 80,
		parts: ["usbc-connector"],
		deviceCategories: ["Telefonia", "Acessórios"],
		testInstructions: ["Testar carga rápida e transferência de dados"],
		testParameters: [],
	},
];
