import { randomDelay } from "../async";

export const serviceDeviceCategories = [
	"Telefonia",
	"Notebook e Informática",
	"Televisores e video",
	"Acessórios",
] as const;

export type ServiceDeviceCategory = (typeof serviceDeviceCategories)[number];

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

export async function getServices(): Promise<ServiceRow[]> {
	await randomDelay(); // Simulate API delay
	return mockServices;
}
