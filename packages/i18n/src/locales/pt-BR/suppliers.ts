import type { Translated } from "../../types";
import type { suppliers as source } from "../en/suppliers";

export const suppliers: Translated<typeof source> = {
	page: {
		title: "Fornecedores",
		description: "Controle os fornecedores das peças da sua loja",
		newTitle: "Cadastrar fornecedor",
		newDescription:
			"Preencha os campos abaixo para cadastrar um novo fornecedor.",
	},
	table: {
		search: "Busque por fornecedor, CNPJ, contato, telefone, email ou peça...",
		create: "Novo fornecedor",
		headers: {
			name: "Nome",
			cnpj: "CNPJ",
			contact: "Contato",
			phone: "Telefone",
			email: "Email",
			partsCount: "Qtd. de peças",
		},
	},
	form: {
		nameLabel: "Nome",
		namePlaceholder: "TechParts Distribuidora",
		cnpjLabel: "CNPJ",
		contactLabel: "Contato",
		contactPlaceholder: "Nome do responsável",
		phoneLabel: "Telefone",
		emailLabel: "Email",
		emailPlaceholder: "vendas@fornecedor.com.br",
		submit: "Cadastrar fornecedor",
		created: "Fornecedor cadastrado com sucesso!",
	},
};
