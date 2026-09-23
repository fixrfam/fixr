import type { Translated } from "../../types";
import type { dashboard as source } from "../en/dashboard";

export const dashboard: Translated<typeof source> = {
	metadata: {
		title: "Fixr - Painel",
	},
	sidebar: {
		myCompany: "Minha empresa",
		quickAccess: "Acesso rápido",
		sections: {
			system: "Sistema",
			modules: "Módulos",
			company: "Empresa",
		},
	},
	nav: {
		home: "Início",
		notifications: "Notificações",
		logs: "Registros",
		settings: "Configurações",
		profile: "Perfil",
		security: "Segurança",
		apiKeys: "Chaves de API",
		serviceOrders: "Ordens de Serviço",
		estimates: "Orçamentos",
		suppliers: "Fornecedores",
		parts: "Peças",
		inventory: "Estoque",
		support: "Suporte",
		customers: "Clientes",
		devices: "Aparelhos",
		employees: "Funcionários",
	},
	account: {
		manage: "Gerenciar",
		title: "Perfil",
		description: "Gerencie as configurações da sua conta.",
	},
	home: {
		title: "Início",
		description: "Bem vindo ao seu painel de controle!",
	},
	notFound: {
		title: "Em breve por aqui!",
		description: "Essa funcionalidade ainda está em construção.",
		hint: "Estamos trabalhando para lançar novidades o quanto antes. Obrigado pela paciência!",
	},
} as const;
