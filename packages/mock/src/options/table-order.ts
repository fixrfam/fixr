export type ServiceOrderStatus =
	| "registered"
	| "parts_pending"
	| "analysis"
	| "finished"
	| "canceled"
	| "quote_pending"
	| "approval_pending"
	| "in_progress"
	| "ready_for_pickup";

export interface ServiceOrderRow {
	id: string;
	orderNumber: string;
	line:
		| "Telefonia"
		| "Notebook e Informática"
		| "Televisores e video"
		| "Acessórios";
	mark: string;
	model: string;
	technician: string;
	status: {
		id: ServiceOrderStatus;
		label: string;
	};
	client: {
		name: string;
		cpf: string;
		phone: string;
	};
	orderDetails?: {
		receivedAt: string;
		imei: string;
		description: string;
	};
	notes?: string;
	parts?: string[];
	history: {
		id: string;
		status: ServiceOrderStatus;
		label: string;
		dateTime: string;
		comment: string;
	}[];
	images?: {
		id: string;
		url: string;
		description: string;
	}[];
}

export const mockServiceOrders: ServiceOrderRow[] = [
	{
		id: "1",
		orderNumber: "58241",
		line: "Telefonia",
		mark: "Apple",
		model: "iPhone 13",
		technician: "João Silva",
		status: {
			id: "in_progress",
			label: "Reparo em progresso",
		},
		client: {
			name: "Maria Aparecida",
			cpf: "123.456.789-00",
			phone: "(11) 99999-9999",
		},
		orderDetails: {
			receivedAt: "03/05/2026",
			imei: "123456789012345",
			description: "Tela trincada e sem resposta ao toque.",
		},
		notes: "Troca do conector de carga iniciada",
		parts: ["Tela", "Bateria", "Conector de carga"],
		history: [
			{
				id: "h0",
				status: "registered",
				label: "Registrada",
				dateTime: "03/05/2026 14:30",
				comment: "Ordem de serviço registrada pelo técnico.",
			},
			{
				id: "h1",
				status: "analysis",
				label: "Em análise",
				dateTime: "05/05/2026 09:15",
				comment: "Equipamento recebido e iniciado diagnóstico.",
			},
			{
				id: "h2",
				status: "quote_pending",
				label: "Pendente de orçamento",
				dateTime: "05/05/2026 11:40",
				comment: "Orçamento enviado ao cliente para aprovação.",
			},
			{
				id: "h3",
				status: "in_progress",
				label: "Reparo em progresso",
				dateTime: "05/05/2026 14:05",
				comment: "Troca de tela iniciada.",
			},
			{
				id: "h4",
				status: "in_progress",
				label: "Reparo em progresso",
				dateTime: "06/05/2026 16:30",
				comment: "Troca de bateria iniciada.",
			},
			{
				id: "h5",
				status: "in_progress",
				label: "Reparo em progresso",
				dateTime: "07/05/2026 10:00",
				comment: "Troca de conector de carga iniciada.",
			},
		],
		images: [
			{
				id: "img1",
				url: "https://i.redd.it/broken-screen-and-back-iphone-13-pro-how-much-is-it-worth-v0-snmnyouzrwwe1.jpg?width=3024&format=pjpg&auto=webp&s=cc71f74906440b64bc06ca3cc69d80df06bcdf7a",
				description: "Foto do aparelho com a tela trincada.",
			},
			{
				id: "img2",
				url: "https://preview.redd.it/can-someone-help-how-to-fix-a-broken-white-screen-iphone-13-v0-tokryq9qydme1.jpeg?width=1080&crop=smart&auto=webp&s=b95b6119f107fe887ada88ebe0846326000c4ed0",
				description: "Foto do aparelho sem resposta ao toque.",
			},
		],
	},
	{
		id: "2",
		orderNumber: "60918",
		line: "Telefonia",
		mark: "Samsung",
		model: "Galaxy S21",
		technician: "Ana Costa",
		status: {
			id: "parts_pending",
			label: "Pendente de peças",
		},
		client: {
			name: "Carlos Eduardo",
			cpf: "987.654.321-00",
			phone: "(21) 98888-8888",
		},
		orderDetails: {
			receivedAt: "04/05/2026",
			imei: "543210987654321",
			description: "Bateria descarrega rapidamente e superaquecimento.",
		},
		notes: "Diagnóstico concluído, aguardando chegada de bateria nova.",
		history: [
			{
				id: "h0",
				status: "registered",
				label: "Registrada",
				dateTime: "04/05/2026 09:00",
				comment: "Ordem de serviço registrada pelo técnico.",
			},
			{
				id: "h0b",
				status: "analysis",
				label: "Em análise",
				dateTime: "04/05/2026 14:00",
				comment: "Diagnóstico concluído, necessário troca de bateria.",
			},
			{
				id: "h1",
				status: "parts_pending",
				label: "Pendente de peças",
				dateTime: "06/05/2026 10:20",
				comment: "Aguardando chegada de bateria nova.",
			},
		],
		parts: ["Bateria"],
		images: [
			{
				id: "img1",
				url: "https://eu.community.samsung.com/t5/image/serverpage/image-id/2620867iFECC0D4F8CEA7AEA?v=v2",
				description: "Bateria do celular inchando",
			},
		],
	},
	{
		id: "3",
		orderNumber: "73506",
		line: "Telefonia",
		mark: "Motorola",
		model: "Moto G Power",
		technician: "Ricardo Alves",
		status: {
			id: "finished",
			label: "Finalizada",
		},
		client: {
			name: "Fernanda Lima",
			cpf: "111.222.333-44",
			phone: "(31) 97777-7777",
		},
		orderDetails: {
			receivedAt: "01/05/2026",
			imei: "678901234567890",
			description: "Alto-falante com som distorcido e baixo volume.",
		},
		notes: "Reparo concluído, aguardando retirada pelo cliente.",
		history: [
			{
				id: "h0",
				status: "registered",
				label: "Registrada",
				dateTime: "01/05/2026 08:30",
				comment: "Ordem de serviço registrada pelo técnico.",
			},
			{
				id: "h1",
				status: "analysis",
				label: "Em análise",
				dateTime: "02/05/2026 09:00",
				comment: "Equipamento recebido e iniciado diagnóstico.",
			},
			{
				id: "h2",
				status: "quote_pending",
				label: "Pendente de orçamento",
				dateTime: "02/05/2026 12:30",
				comment: "Orçamento enviado ao cliente para aprovação.",
			},
			{
				id: "h3",
				status: "in_progress",
				label: "Reparo em progresso",
				dateTime: "03/05/2026 15:45",
				comment: "Troca de alto-falante iniciada.",
			},
			{
				id: "h4",
				status: "finished",
				label: "Finalizada",
				dateTime: "04/05/2026 11:20",
				comment: "Reparo concluído, aguardando retirada pelo cliente.",
			},
		],
		parts: ["Alto-falante"],
		images: [
			{
				id: "img1",
				url: "https://i.redd.it/9h3ki7g7fbe61.jpg",
				description: "Foto do aparelho com agua no interior.",
			},
		],
	},
	{
		id: "4",
		orderNumber: "81473",
		line: "Notebook e Informática",
		mark: "Dell",
		model: "XPS 13",
		technician: "Mariana Souza",
		status: {
			id: "canceled",
			label: "Cancelada",
		},
		client: {
			name: "Eduardo Pereira",
			cpf: "555.666.777-88",
			phone: "(41) 96666-6666",
		},
		orderDetails: {
			receivedAt: "05/05/2026",
			imei: "",
			description:
				"Notebook não liga, sem resposta ao pressionar o botão power.",
		},
		notes: "Cliente optou por cancelar a ordem de serviço.",
		history: [
			{
				id: "h0",
				status: "registered",
				label: "Registrada",
				dateTime: "05/05/2026 10:00",
				comment: "Ordem de serviço registrada pelo técnico.",
			},
			{
				id: "h1",
				status: "analysis",
				label: "Em análise",
				dateTime: "06/05/2026 14:10",
				comment: "Equipamento recebido e iniciado diagnóstico.",
			},
			{
				id: "h2",
				status: "quote_pending",
				label: "Pendente de orçamento",
				dateTime: "06/05/2026 17:25",
				comment: "Orçamento enviado ao cliente para aprovação.",
			},
			{
				id: "h3",
				status: "canceled",
				label: "Cancelada",
				dateTime: "07/05/2026 09:00",
				comment: "Cliente optou por cancelar a ordem de serviço.",
			},
		],
		images: [
			{
				id: "img1",
				url: "https://newyorkcomputerhelp.com/wp-content/uploads/2020/11/blue-screen-pc-windows-issue-1024x1024.jpg",
				description: "Foto do notebook dando tela azul ao ligar.",
			},
		],
	},
];
