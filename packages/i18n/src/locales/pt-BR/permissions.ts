import type { Translated } from "../../types";
import type { permissions as source } from "../en/permissions";

export const permissions: Translated<typeof source> = {
	resources: {
		account: "Conta",
		apiKeys: "Chaves de API",
		companies: "Empresa",
		customers: "Clientes",
		devices: "Aparelhos",
		employees: "Funcionários",
		estimates: "Orçamentos",
		inventory: "Estoque",
		logs: "Registros",
		parts: "Peças",
		serviceOrders: "Ordens de Serviço",
		services: "Serviços",
		settings: "Configurações",
		suppliers: "Fornecedores",
	},
	actions: {
		adjust: "Ajustar",
		assign: "Atribuir",
		changeStatus: "Alterar status",
		create: "Criar",
		delete: "Excluir",
		read: "Ler",
		revoke: "Revogar",
		security: "Segurança",
		sendToCustomer: "Enviar ao cliente",
		update: "Editar",
	},
	matrix: {
		title: "Cargos e permissões",
		description:
			"O que cada cargo pode fazer na empresa. Estas são as permissões padrão que cada funcionário recebe pelo cargo.",
		permission: "Permissão",
		allowed: "Permitido",
		notAllowed: "Não permitido",
		yourRole: "Seu cargo",
		count_one: "{{count}} permissão",
		count_other: "{{count}} permissões",
	},
	roleDescriptions: {
		guest: "Sem acesso até um administrador definir um cargo.",
		technician:
			"Trabalha nas ordens de serviço e consulta o catálogo de peças e serviços.",
		warehouse: "Cuida de peças, fornecedores e ajustes de estoque.",
		financial: "Monta, precifica e envia orçamentos aos clientes.",
		manager:
			"Toca o dia a dia: ordens de serviço, clientes, catálogo, orçamentos e novos funcionários.",
		admin: "Acesso total, incluindo excluir registros e gerenciar a empresa.",
	},
} as const;
