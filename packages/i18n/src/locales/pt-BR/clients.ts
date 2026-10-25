import type { Translated } from "../../types";
import type { clients as source } from "../en/clients";

export const clients: Translated<typeof source> = {
	form: {
		nameLabel: "Nome",
		namePlaceholder: "João da Silva",
		emailLabel: "Email",
		emailPlaceholder: "joao.silva@email.com",
		phoneLabel: "Telefone",
		phonePlaceholder: "(00) 00000-0000",
		alternativePhoneLabel: "Telefone alternativo",
		documentLabel: "CPF",
		documentPlaceholder: "000.000.000-00",
		addressLabel: "Endereço",
		addressPlaceholder: "Rua, Av...",
		stateLabel: "Estado",
		statePlaceholder: "UF",
		cityLabel: "Cidade",
		cityPlaceholder: "Cidade",
		submit: "Finalizar cadastro",
		success: "Cliente cadastrado com sucesso!",
		error: "Erro ao cadastrar cliente",
	},
} as const;
