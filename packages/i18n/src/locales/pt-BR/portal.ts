import type { Translated } from "../../types";
import type { portal as source } from "../en/portal";

export const portal: Translated<typeof source> = {
	header: {
		title: "Minhas ordens de serviço",
		greeting: "Olá, {{name}}!",
		signOut: "Sair",
	},
	list: {
		empty: "Nenhuma ordem de serviço ainda.",
		openedAt: "Aberta em {{date}}",
		details: "Ver detalhes",
		pendingEstimate: "Orçamento aguardando sua resposta",
	},
	detail: {
		back: "Voltar para minhas ordens de serviço",
		title: "{{device}}",
		shop: "Assistência",
		reportedDefect: "Defeito relatado",
		items: "Peças e serviços",
		noItems: "A assistência ainda não adicionou peças ou serviços.",
		estimates: "Orçamentos",
		noEstimates: "Nenhum orçamento enviado ainda.",
		estimateNumber: "Orçamento #{{number}}",
		validUntil: "Válido até {{date}}",
		total: "Total {{total}}",
		openPdf: "Abrir PDF",
		approve: "Aprovar",
		reject: "Recusar",
		expired: "Vencido",
		contact: "Contato",
	},
	status: {
		pending: "Recebida",
		diagnosing: "Em diagnóstico",
		waiting_approval: "Aguardando sua aprovação",
		approved: "Aprovada",
		fixing: "Em conserto",
		ready: "Pronta para retirada",
		delivered: "Entregue",
	},
	entry: {
		opening: "Abrindo sua área...",
		invalidTitle: "Link indisponível",
		invalidDescription:
			"Este link é inválido ou foi substituído por um mais novo. Peça um novo link com o seu email.",
		requestNew: "Receber um novo link",
	},
	access: {
		title: "Acessar minhas ordens de serviço",
		description:
			"Informe o email que você passou para a assistência. Vamos te enviar um link para ver suas ordens de serviço.",
		email: "Email",
		emailPlaceholder: "voce@email.com",
		submit: "Enviar link",
		sending: "Enviando...",
		sentTitle: "Confira seu email",
		sentDescription:
			"Se este email estiver cadastrado em alguma assistência que usa o Fixr, você vai receber um link em instantes.",
	},
	fromEstimate: "Ver todas as minhas ordens de serviço",
	shopActions: {
		sendAccess: "Enviar acesso ao portal",
		sendAccessTitle: "Enviar acesso ao portal para {{name}}",
		sendAccessDescription:
			"O cliente recebe por email um link do portal do cliente, onde acompanha as ordens de serviço e responde orçamentos. Links enviados antes pela sua assistência deixam de funcionar.",
		confirm: "Enviar acesso",
		cancel: "Cancelar",
	},
};
