import type { Translated } from "../../types";
import type { company as source } from "../en/company";

export const company: Translated<typeof source> = {
	page: {
		title: "Empresa",
		description: "Dados exibidos nos seus orçamentos e outros documentos.",
	},
	sections: {
		identity: {
			title: "Identidade",
			description: "Como a sua assistência aparece para os clientes.",
		},
		contact: {
			title: "Contato",
			description: "Onde os clientes encontram e falam com você.",
		},
	},
	logo: {
		title: "Logo",
		description: "Aparece no cabeçalho dos seus orçamentos.",
		pickHint: "Arraste uma imagem ou clique para escolher",
		upload: "Enviar logo",
		replace: "Trocar logo",
		remove: "Remover",
		alt: "Logo da empresa",
		dialogTitle: "Logo da empresa",
		stepSelect: "Escolha uma imagem do seu logo.",
		stepCrop: "Ajuste o enquadramento do seu logo.",
		stepUploading: "Salvando...",
		saving: "Enviando seu logo...",
		dropzoneTitle: "Envie seu logo",
		dropzoneHint: "Arraste aqui ou clique para escolher",
		uploaded: "Logo pronto. Salve as alterações para aplicar.",
		uploadError: "Não foi possível enviar o logo.",
	},
	form: {
		name: "Razão social",
		nameDescription:
			"Aparece no topo dos orçamentos, nos e-mails enviados aos clientes e no portal do cliente.",
		cnpj: "CNPJ",
		cnpjDescription:
			"Sai nos seus orçamentos. Foi definido no cadastro da empresa e não pode ser alterado.",
		address: "Endereço",
		addressDescription:
			"Onde os clientes deixam e retiram os aparelhos. Aparece nos orçamentos e no portal do cliente.",
		addressPlaceholder: "Rua, número, cidade - UF",
		email: "E-mail de contato",
		emailDescription:
			"Onde os clientes falam com a assistência. Aparece nos orçamentos e no portal do cliente.",
		emailPlaceholder: "contato@suaassistencia.com.br",
		phone: "Telefone",
		phoneDescription:
			"Telefone de contato que aparece nos orçamentos e no portal do cliente.",
		website: "Site",
		websiteDescription:
			"Opcional. Site ou rede social da assistência, exibido nos orçamentos e no portal do cliente.",
		websitePlaceholder: "https://suaassistencia.com.br",
		save: "Salvar alterações",
		discard: "Descartar",
		saveHint: "Somente administradores podem alterar estes dados.",
	},
};
