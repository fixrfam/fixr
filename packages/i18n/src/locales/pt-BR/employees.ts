import type { Translated } from "../../types";
import type { employees as source } from "../en/employees";

export const employees: Translated<typeof source> = {
	page: {
		title: "Funcionários",
		description: "Veja ou gerencie os funcionários da sua empresa",
		newTitle: "Cadastrar funcionários",
		newDescription: "Adicione um ou mais os funcionários na sua empresa.",
	},
	table: {
		search: "Procurar funcionários...",
		columns: "Colunas",
		create: "Cadastrar funcionários",
		headers: {
			name: "Funcionário",
			role: "Cargo",
			email: "Email",
			document: "CPF",
			createdAt: "Cadastrado em",
			actions: "Ações",
		},
		viewProfile: "Ver perfil",
	},
	form: {
		nameLabel: "Nome do funcionário",
		namePlaceholder: "João da Silva",
		nameDescription: "Este será o nome exibido no sistema.",
		roleLabel: "Cargo",
		rolePlaceholder: "Selecione um cargo",
		roleDescription: "Nível de acesso do funcionário no Fixr.",
		documentLabel: "CPF",
		documentPlaceholder: "123.456.789-00",
		emailLabel: "Email",
		emailPlaceholder: "email@funcionario.com",
		emailDescription: "Utilizado para login no sistema.",
		passwordLabel: "Senha",
		passwordDescription: "A senha de login do funcionário",
		generate: "Gerar",
		submit: "Cadastrar",
	},
} as const;
