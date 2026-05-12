export interface LineOption {
	id: string;
	name: string;
}

export interface TechnicianOption {
	id: string;
	name: string;
}

export interface StatusOption {
	value: string;
	label: string;
}

export const mockLines: LineOption[] = [
	{ id: "linha-1", name: "Telefonia" },
	{ id: "linha-2", name: "Notebook e informática" },
	{ id: "linha-3", name: "Televisores e video" },
	{ id: "linha-4", name: "Acessórios" },
];

export const mockTechnicians: TechnicianOption[] = [
	{ id: "tec-1", name: "João Silva" },
	{ id: "tec-2", name: "Maria Santos" },
	{ id: "tec-3", name: "Carlos Oliveira" },
	{ id: "tec-4", name: "Ana Costa" },
];

export const mockStatuses: StatusOption[] = [
	{ value: "pendente-de-peças", label: "Pendente de peças" },
	{ value: "em-analise", label: "Em análise" },
	{ value: "entregue", label: "Entregue" },
	{ value: "cancelada", label: "Cancelada" },
	{ value: "aguardando-orcamento", label: "Aguardando orçamento" },
	{ value: "aguardando-aprovacao", label: "Aguardando aprovação" },
	{ value: "reparo-em-progresso", label: "Reparo em progresso" },
	{ value: "pronto-para-retirada", label: "Pronto para retirada" },
	{ value: "finalizada", label: "Finalizada" },
	{ value: "cliente-contatato", label: "Cliente contatado" },
];

export function getLines(): LineOption[] {
	return mockLines;
}

export function getTechnicians(): TechnicianOption[] {
	return mockTechnicians;
}

export function getStatuses(): StatusOption[] {
	return mockStatuses;
}

export function getFilterOptions() {
	return {
		lines: getLines(),
		technicians: getTechnicians(),
		statuses: getStatuses(),
	};
}
