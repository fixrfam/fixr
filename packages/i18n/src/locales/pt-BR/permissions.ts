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
} as const;
