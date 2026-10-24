import type { Translated } from "../../types";
import type { company as source } from "../en/company";

export const company: Translated<typeof source> = {
	page: {
		title: "Empresa",
		description: "Dados exibidos nos seus orçamentos e outros documentos.",
	},
	logo: {
		title: "Logo",
		description:
			"Aparece no cabeçalho dos seus documentos. PNG, JPG ou WebP de até 5 MB.",
		upload: "Enviar logo",
		replace: "Trocar logo",
		remove: "Remover",
		alt: "Logo da empresa",
		uploading: "Enviando...",
		tooLarge: "O logo deve ter no máximo 5 MB.",
	},
	form: {
		name: "Razão social",
		cnpj: "CNPJ",
		cnpjDescription: "O CNPJ não pode ser alterado.",
		address: "Endereço",
		addressPlaceholder: "Rua, número, cidade - UF",
		email: "E-mail de contato",
		emailPlaceholder: "contato@suaassistencia.com.br",
		phone: "Telefone",
		website: "Site",
		websitePlaceholder: "https://suaassistencia.com.br",
		save: "Salvar alterações",
	},
};
