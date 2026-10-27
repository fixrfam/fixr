import type { Translated } from "../../types";
import type { devices as source } from "../en/devices";

export const devices: Translated<typeof source> = {
	page: {
		title: "Aparelhos dos clientes",
		description:
			"Todos os aparelhos dos seus clientes e onde cada um está agora.",
	},
	status: {
		in_shop: "Na loja",
		ready_for_pickup: "Pronto para retirada",
		with_customer: "Com o cliente",
	},
	table: {
		search: "Busque por modelo, marca, dono, IMEI ou número de série...",
		create: "Novo aparelho",
		allStatuses: "Todos os status",
		statusFilter: "Status",
		headers: {
			device: "Aparelho",
			owner: "Dono",
			identifiers: "IMEI / série",
			status: "Status",
			updatedAt: "Atualizado",
			actions: "Ações",
		},
		noIdentifiers: "Não informado",
	},
	form: {
		createTitle: "Novo aparelho",
		createDescription: "Cadastre o aparelho de um dos seus clientes.",
		editTitle: "Editar aparelho",
		editDescription:
			"Altere o modelo, os identificadores, as observações ou o status do aparelho.",
		customerLabel: "Dono",
		customerPlaceholder: "Busque um cliente pelo nome ou CPF",
		customerEmpty: "Nenhum cliente encontrado.",
		modelLabel: "Modelo",
		modelPlaceholder: "Busque no catálogo",
		modelEmpty: "Nenhum modelo encontrado.",
		imeiLabel: "IMEI",
		imeiPlaceholder: "356938035643809",
		serialNumberLabel: "Número de série",
		serialNumberPlaceholder: "C02XK0AAJG5H",
		notesLabel: "Observações",
		notesPlaceholder: "Riscos, acessórios deixados com o aparelho...",
		statusLabel: "Onde está",
		create: "Cadastrar aparelho",
		save: "Salvar alterações",
		created: "Aparelho cadastrado!",
		updated: "Aparelho atualizado!",
		modelCreate: "Adicionar “{{name}}” ao catálogo",
		modelCreateTitle: "Novo modelo",
		modelCreateDescription: "Ele entra no catálogo da sua empresa.",
		modelNameLabel: "Nome",
		makerLabel: "Marca",
		makerPlaceholder: "Busque uma marca",
		makerEmpty: "Nenhuma marca encontrada.",
		categoryLabel: "Categoria",
		categoryNone: "Sem categoria",
		modelCreateSubmit: "Adicionar modelo",
		modelCreateBack: "Voltar para a busca",
		modelCreated: "Modelo adicionado ao catálogo!",
		modelBrowseTitle: "Escolha o modelo",
		modelBrowseDescription:
			"Busque no catálogo por nome, marca ou especificações e filtre por categoria.",
		modelMissing: "Não está no catálogo?",
		modelAdd: "Adicionar modelo",
	},
	actions: {
		edit: "Editar",
		delete: "Excluir",
		openServiceOrder: "Abrir ordem de serviço",
		menu: "Ações do aparelho",
	},
	delete: {
		title: "Excluir este aparelho?",
		description:
			"Ele sai da lista, mas as ordens de serviço continuam ligadas a ele.",
		confirm: "Excluir",
		cancel: "Cancelar",
		deleted: "Aparelho excluído.",
	},
	detail: {
		empty: "Este cliente ainda não tem aparelhos.",
	},
};
