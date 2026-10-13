import { randomDelay } from "../async";

export const partCategories = [
	"Telas e displays",
	"Baterias",
	"Conectores",
	"Câmeras",
	"Placas e componentes",
	"Armazenamento",
	"Carcaças e tampas",
	"Áudio",
] as const;

export type PartCategory = (typeof partCategories)[number];

export const serviceDeviceCategories = [
	"Telefonia",
	"Notebook e Informática",
	"Televisores e video",
	"Acessórios",
] as const;

export type ServiceDeviceCategory = (typeof serviceDeviceCategories)[number];

export interface SupplierRow {
	id: string;
	name: string;
	cnpj: string;
	contact: string;
	phone: string;
	email: string;
}

export interface PartRow {
	id: string;
	sku: string;
	name: string;
	category: PartCategory;
	costPrice: number;
	salePrice: number;
	stock: number;
	minStock: number;
	supplierId: string;
}

export interface ServiceRow {
	id: string;
	name: string;
	description: string;
	estimatedDurationMinutes: number;
	price: number;
	partIds: string[];
	deviceCategories: ServiceDeviceCategory[];
	testInstructions: string[];
	testParameters: string[];
}

export const mockSuppliers: SupplierRow[] = [
	{
		id: "sup-1",
		name: "TechParts Distribuidora",
		cnpj: "12.345.678/0001-90",
		contact: "Renata Albuquerque",
		phone: "(11) 3456-7890",
		email: "vendas@techparts.com.br",
	},
	{
		id: "sup-2",
		name: "CellFix Importados",
		cnpj: "23.456.789/0001-01",
		contact: "Marcos Tavares",
		phone: "(11) 98765-4321",
		email: "marcos@cellfix.com.br",
	},
	{
		id: "sup-3",
		name: "InfoBoard Componentes",
		cnpj: "34.567.890/0001-12",
		contact: "Juliana Prado",
		phone: "(19) 3232-1010",
		email: "comercial@infoboard.com.br",
	},
	{
		id: "sup-4",
		name: "Power Cell Baterias",
		cnpj: "45.678.901/0001-23",
		contact: "Diego Nascimento",
		phone: "(21) 99888-7766",
		email: "diego@powercell.com.br",
	},
	{
		id: "sup-5",
		name: "VisionTV Peças",
		cnpj: "56.789.012/0001-34",
		contact: "Patrícia Moreira",
		phone: "(31) 3344-5566",
		email: "atendimento@visiontv.com.br",
	},
	{
		id: "sup-6",
		name: "Sul Eletrônicos Atacado",
		cnpj: "67.890.123/0001-45",
		contact: "Felipe Schneider",
		phone: "(51) 3030-4040",
		email: "felipe@suleletronicos.com.br",
	},
];

export const mockParts: PartRow[] = [
	{
		id: "part-1",
		sku: "TEL-IP13-OLED",
		name: "Tela OLED iPhone 13",
		category: "Telas e displays",
		costPrice: 480,
		salePrice: 890,
		stock: 6,
		minStock: 3,
		supplierId: "sup-2",
	},
	{
		id: "part-2",
		sku: "TEL-S22-AMOLED",
		name: "Tela AMOLED Galaxy S22",
		category: "Telas e displays",
		costPrice: 620,
		salePrice: 1090,
		stock: 2,
		minStock: 3,
		supplierId: "sup-2",
	},
	{
		id: "part-3",
		sku: "TEL-NB156-FHD",
		name: 'Tela LED 15.6" Full HD 30 pinos',
		category: "Telas e displays",
		costPrice: 390,
		salePrice: 690,
		stock: 4,
		minStock: 2,
		supplierId: "sup-3",
	},
	{
		id: "part-4",
		sku: "TEL-TV50-BARRA",
		name: 'Kit barras de LED TV 50"',
		category: "Telas e displays",
		costPrice: 145,
		salePrice: 320,
		stock: 0,
		minStock: 2,
		supplierId: "sup-5",
	},
	{
		id: "part-5",
		sku: "BAT-IP13",
		name: "Bateria iPhone 13",
		category: "Baterias",
		costPrice: 95,
		salePrice: 249,
		stock: 14,
		minStock: 5,
		supplierId: "sup-4",
	},
	{
		id: "part-6",
		sku: "BAT-S22",
		name: "Bateria Galaxy S22",
		category: "Baterias",
		costPrice: 88,
		salePrice: 229,
		stock: 5,
		minStock: 5,
		supplierId: "sup-4",
	},
	{
		id: "part-7",
		sku: "BAT-MOTOG60",
		name: "Bateria Moto G60",
		category: "Baterias",
		costPrice: 62,
		salePrice: 169,
		stock: 9,
		minStock: 4,
		supplierId: "sup-4",
	},
	{
		id: "part-8",
		sku: "BAT-NB-DELL3511",
		name: "Bateria Dell Inspiron 3511",
		category: "Baterias",
		costPrice: 210,
		salePrice: 420,
		stock: 0,
		minStock: 2,
		supplierId: "sup-3",
	},
	{
		id: "part-9",
		sku: "CON-LIGHTNING",
		name: "Conector de carga Lightning",
		category: "Conectores",
		costPrice: 38,
		salePrice: 120,
		stock: 18,
		minStock: 6,
		supplierId: "sup-1",
	},
	{
		id: "part-10",
		sku: "CON-USBC-S22",
		name: "Conector de carga USB-C Galaxy S22",
		category: "Conectores",
		costPrice: 32,
		salePrice: 110,
		stock: 3,
		minStock: 6,
		supplierId: "sup-1",
	},
	{
		id: "part-11",
		sku: "CON-DCJACK-NB",
		name: "Conector DC Jack notebook universal",
		category: "Conectores",
		costPrice: 18,
		salePrice: 75,
		stock: 22,
		minStock: 8,
		supplierId: "sup-3",
	},
	{
		id: "part-12",
		sku: "CON-HDMI-TV",
		name: "Conector HDMI para placa de TV",
		category: "Conectores",
		costPrice: 12,
		salePrice: 60,
		stock: 11,
		minStock: 4,
		supplierId: "sup-5",
	},
	{
		id: "part-13",
		sku: "CAM-IP13-TRAS",
		name: "Câmera traseira iPhone 13",
		category: "Câmeras",
		costPrice: 260,
		salePrice: 520,
		stock: 3,
		minStock: 2,
		supplierId: "sup-2",
	},
	{
		id: "part-14",
		sku: "CAM-S22-FRONT",
		name: "Câmera frontal Galaxy S22",
		category: "Câmeras",
		costPrice: 110,
		salePrice: 260,
		stock: 1,
		minStock: 2,
		supplierId: "sup-2",
	},
	{
		id: "part-15",
		sku: "PLC-FONTE-TV50",
		name: 'Placa fonte TV LED 50"',
		category: "Placas e componentes",
		costPrice: 185,
		salePrice: 390,
		stock: 2,
		minStock: 1,
		supplierId: "sup-5",
	},
	{
		id: "part-16",
		sku: "PLC-CI-CARGA-U2",
		name: "CI de carga U2 Tristar",
		category: "Placas e componentes",
		costPrice: 24,
		salePrice: 180,
		stock: 7,
		minStock: 3,
		supplierId: "sup-1",
	},
	{
		id: "part-17",
		sku: "PLC-COOLER-NB",
		name: "Cooler notebook Lenovo IdeaPad 3",
		category: "Placas e componentes",
		costPrice: 55,
		salePrice: 150,
		stock: 0,
		minStock: 2,
		supplierId: "sup-3",
	},
	{
		id: "part-18",
		sku: "PLC-PASTA-TERM",
		name: "Pasta térmica 4g prata",
		category: "Placas e componentes",
		costPrice: 14,
		salePrice: 40,
		stock: 30,
		minStock: 10,
		supplierId: "sup-6",
	},
	{
		id: "part-19",
		sku: "ARM-SSD-240",
		name: "SSD SATA 240GB",
		category: "Armazenamento",
		costPrice: 125,
		salePrice: 239,
		stock: 8,
		minStock: 4,
		supplierId: "sup-6",
	},
	{
		id: "part-20",
		sku: "ARM-SSD-NVME-500",
		name: "SSD NVMe 500GB",
		category: "Armazenamento",
		costPrice: 235,
		salePrice: 429,
		stock: 4,
		minStock: 4,
		supplierId: "sup-6",
	},
	{
		id: "part-21",
		sku: "ARM-RAM-8GB-DDR4",
		name: "Memória RAM 8GB DDR4 notebook",
		category: "Armazenamento",
		costPrice: 115,
		salePrice: 219,
		stock: 10,
		minStock: 4,
		supplierId: "sup-6",
	},
	{
		id: "part-22",
		sku: "CAR-TAMPA-IP13",
		name: "Tampa traseira iPhone 13",
		category: "Carcaças e tampas",
		costPrice: 70,
		salePrice: 199,
		stock: 5,
		minStock: 2,
		supplierId: "sup-1",
	},
	{
		id: "part-23",
		sku: "CAR-TAMPA-S22",
		name: "Tampa traseira Galaxy S22",
		category: "Carcaças e tampas",
		costPrice: 58,
		salePrice: 179,
		stock: 0,
		minStock: 2,
		supplierId: "sup-1",
	},
	{
		id: "part-24",
		sku: "AUD-ALTO-IP13",
		name: "Alto-falante auricular iPhone 13",
		category: "Áudio",
		costPrice: 28,
		salePrice: 99,
		stock: 12,
		minStock: 4,
		supplierId: "sup-2",
	},
	{
		id: "part-25",
		sku: "AUD-MIC-UNIV",
		name: "Microfone SMD universal",
		category: "Áudio",
		costPrice: 6,
		salePrice: 45,
		stock: 2,
		minStock: 10,
		supplierId: "sup-1",
	},
];

export const mockServices: ServiceRow[] = [
	{
		id: "srv-1",
		name: "Troca de tela",
		description: "Substituição do display e teste de toque, brilho e sensores.",
		estimatedDurationMinutes: 60,
		price: 150,
		partIds: ["part-1", "part-2", "part-3"],
		deviceCategories: ["Telefonia", "Notebook e Informática"],
		testInstructions: [
			"Testar o toque em toda a área da tela",
			"Verificar brilho mínimo e máximo",
			"Conferir se há pixels mortos ou manchas",
			"Testar sensor de proximidade e brilho automático",
		],
		testParameters: [
			"Teste de toque: grade completa sem falhas",
			"Brilho: 0% a 100% sem cintilação",
			"Pixels mortos: nenhum",
		],
	},
	{
		id: "srv-2",
		name: "Troca de bateria",
		description: "Substituição da bateria com calibração e teste de carga.",
		estimatedDurationMinutes: 40,
		price: 90,
		partIds: ["part-5", "part-6", "part-7", "part-8"],
		deviceCategories: ["Telefonia", "Notebook e Informática"],
		testInstructions: [
			"Fazer um ciclo de carga até 100%",
			"Verificar a saúde da bateria no sistema",
			"Conferir aquecimento durante a carga",
			"Testar autonomia com tela ligada",
		],
		testParameters: [
			"Saúde da bateria: acima de 95%",
			"Temperatura em carga: até 40 °C",
			"Corrente de carga: conforme carregador original",
		],
	},
	{
		id: "srv-3",
		name: "Reparo de conector de carga",
		description: "Troca do conector de carga e limpeza do circuito de entrada.",
		estimatedDurationMinutes: 50,
		price: 110,
		partIds: ["part-9", "part-10", "part-11"],
		deviceCategories: ["Telefonia", "Notebook e Informática", "Acessórios"],
		testInstructions: [
			"Testar carga com cabo e carregador originais",
			"Mexer o cabo para checar mau contato",
			"Testar transferência de dados com o computador",
			"Verificar carga rápida, se o aparelho suportar",
		],
		testParameters: [
			"Tensão de entrada: 5 V (±0,25 V)",
			"Corrente de carga: mínimo 1 A",
			"Reconhecimento no computador: imediato",
		],
	},
	{
		id: "srv-4",
		name: "Reparo de placa (não carrega)",
		description: "Diagnóstico em bancada e troca do CI de carga na placa-mãe.",
		estimatedDurationMinutes: 180,
		price: 320,
		partIds: ["part-16", "part-9"],
		deviceCategories: ["Telefonia"],
		testInstructions: [
			"Medir consumo na fonte de bancada",
			"Verificar carga com bateria abaixo de 20%",
			"Monitorar aquecimento da placa por 30 minutos",
			"Testar ligar e desligar com e sem carregador",
		],
		testParameters: [
			"Consumo em repouso: abaixo de 30 mA",
			"Corrente de carga: mínimo 1 A",
			"Temperatura da placa: até 45 °C",
		],
	},
	{
		id: "srv-5",
		name: "Troca de câmera",
		description: "Substituição do módulo de câmera e teste de foco e flash.",
		estimatedDurationMinutes: 45,
		price: 100,
		partIds: ["part-13", "part-14"],
		deviceCategories: ["Telefonia"],
		testInstructions: [
			"Testar foco automático de perto e de longe",
			"Testar flash e gravação de vídeo",
			"Conferir se há manchas ou poeira na imagem",
			"Alternar entre todas as lentes",
		],
		testParameters: [
			"Foco: imagem nítida em até 2 segundos",
			"Vídeo: 1 minuto sem travamentos",
		],
	},
	{
		id: "srv-6",
		name: "Upgrade de armazenamento e memória",
		description:
			"Instalação de SSD e/ou memória RAM com clonagem do sistema atual.",
		estimatedDurationMinutes: 120,
		price: 180,
		partIds: ["part-19", "part-20", "part-21"],
		deviceCategories: ["Notebook e Informática"],
		testInstructions: [
			"Verificar se o sistema reconhece toda a capacidade",
			"Rodar teste de leitura e gravação do SSD",
			"Rodar teste de memória",
			"Conferir inicialização do sistema clonado",
		],
		testParameters: [
			"SSD SATA: leitura acima de 450 MB/s",
			"SSD NVMe: leitura acima de 1500 MB/s",
			"Teste de memória: 1 passada sem erros",
		],
	},
	{
		id: "srv-7",
		name: "Limpeza interna e troca de pasta térmica",
		description:
			"Desmontagem, limpeza do sistema de refrigeração e nova pasta térmica.",
		estimatedDurationMinutes: 90,
		price: 140,
		partIds: ["part-18", "part-17"],
		deviceCategories: ["Notebook e Informática"],
		testInstructions: [
			"Rodar teste de estresse por 15 minutos",
			"Monitorar temperatura do processador",
			"Verificar ruído e rotação do cooler",
			"Conferir se todos os parafusos foram recolocados",
		],
		testParameters: [
			"Temperatura em repouso: até 50 °C",
			"Temperatura em estresse: até 85 °C",
			"Sem desligamentos durante o teste",
		],
	},
	{
		id: "srv-8",
		name: "Reparo de backlight de TV",
		description: "Troca das barras de LED e teste de imagem por 2 horas.",
		estimatedDurationMinutes: 240,
		price: 280,
		partIds: ["part-4"],
		deviceCategories: ["Televisores e video"],
		testInstructions: [
			"Deixar a TV ligada com imagem branca por 2 horas",
			"Verificar uniformidade da iluminação",
			"Conferir se há pontos escuros ou vazamento de luz",
			"Testar em brilho mínimo e máximo",
		],
		testParameters: [
			"Tensão das barras: conforme etiqueta do painel",
			"Tempo de teste: 2 horas sem apagar",
			"Uniformidade: sem sombras visíveis",
		],
	},
	{
		id: "srv-9",
		name: "Reparo de fonte de TV",
		description: "Substituição da placa fonte e revisão das conexões HDMI.",
		estimatedDurationMinutes: 150,
		price: 220,
		partIds: ["part-15", "part-12"],
		deviceCategories: ["Televisores e video"],
		testInstructions: [
			"Medir as tensões de saída da fonte",
			"Testar todas as entradas HDMI",
			"Ligar e desligar pelo controle 10 vezes",
			"Deixar ligada por 1 hora",
		],
		testParameters: [
			"Standby: 5 V (±0,25 V)",
			"Saída principal: 12 V ou 24 V conforme o modelo",
			"Tempo de teste: 1 hora sem desligar",
		],
	},
	{
		id: "srv-10",
		name: "Troca de tampa traseira",
		description: "Remoção da tampa danificada e colagem da nova com vedação.",
		estimatedDurationMinutes: 35,
		price: 80,
		partIds: ["part-22", "part-23"],
		deviceCategories: ["Telefonia"],
		testInstructions: [
			"Conferir o alinhamento da tampa",
			"Verificar se a câmera traseira ficou sem obstrução",
			"Testar carregamento sem fio, se houver",
			"Aguardar a cura da cola antes de entregar",
		],
		testParameters: [
			"Tempo de cura: mínimo 30 minutos sob pressão",
			"Folga nas bordas: nenhuma",
		],
	},
	{
		id: "srv-11",
		name: "Reparo de áudio",
		description: "Troca de alto-falante ou microfone e teste de chamadas.",
		estimatedDurationMinutes: 40,
		price: 85,
		partIds: ["part-24", "part-25"],
		deviceCategories: ["Telefonia", "Acessórios"],
		testInstructions: [
			"Fazer uma chamada de teste",
			"Gravar e reproduzir um áudio",
			"Testar o volume máximo sem distorção",
			"Testar o viva-voz",
		],
		testParameters: [
			"Volume máximo: sem chiado ou distorção",
			"Gravação: voz clara a 30 cm",
		],
	},
	{
		id: "srv-12",
		name: "Diagnóstico técnico",
		description: "Avaliação completa do aparelho com laudo e orçamento.",
		estimatedDurationMinutes: 30,
		price: 50,
		partIds: [],
		deviceCategories: [
			"Telefonia",
			"Notebook e Informática",
			"Televisores e video",
			"Acessórios",
		],
		testInstructions: [
			"Registrar o defeito relatado e o defeito constatado",
			"Testar as funções básicas do aparelho",
			"Verificar sinais de oxidação ou queda",
		],
		testParameters: [],
	},
];

export async function getParts(): Promise<PartRow[]> {
	await randomDelay(); // Simulate API delay
	return mockParts;
}

export async function getServices(): Promise<ServiceRow[]> {
	await randomDelay(); // Simulate API delay
	return mockServices;
}

export async function getSuppliers(): Promise<SupplierRow[]> {
	await randomDelay(); // Simulate API delay
	return mockSuppliers;
}
