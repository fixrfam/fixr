export const STATUS_MAP = {
	parts_pending: {
		id: "parts_pending",
		label: "Pendente de peças",
	},
	analysis: {
		id: "analysis",
		label: "Em análise",
	},
	finished: {
		id: "finished",
		label: "Finalizada",
	},
	canceled: {
		id: "canceled",
		label: "Cancelada",
	},
	quote_pending: {
		id: "quote_pending",
		label: "Aguardando orçamento",
	},
	approval_pending: {
		id: "approval_pending",
		label: "Aguardando aprovação",
	},
	in_progress: {
		id: "in_progress",
		label: "Reparo em progresso",
	},
	ready_for_pickup: {
		id: "ready_for_pickup",
		label: "Pronto para retirada",
	},
	contacted: {
		id: "contacted",
		label: "Cliente contatado",
	},
} as const;

export type StatusId = keyof typeof STATUS_MAP;
