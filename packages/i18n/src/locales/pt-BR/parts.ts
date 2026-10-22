import type { Translated } from "../../types";
import type { parts as source } from "../en/parts";

export const parts: Translated<typeof source> = {
	page: {
		title: "Peças",
		description: "Controle as peças dos seus aparelhos",
		newTitle: "Cadastrar peça",
		newDescription: "Preencha os campos abaixo para cadastrar uma nova peça.",
		editTitle: "Editar peça",
		editDescription: "Altere os campos abaixo e salve as modificações.",
		notFound: "Não encontramos esta peça.",
	},
	stockStatus: {
		in_stock: "Em estoque",
		low_stock: "Estoque baixo",
		out_of_stock: "Sem estoque",
	},
	table: {
		search: "Busque por SKU, nome, categoria, fornecedor, CNPJ ou serviço...",
		create: "Nova peça",
		noSupplier: "Sem fornecedor",
		editLabel: "Editar {{name}}",
		headers: {
			sku: "SKU",
			name: "Nome",
			category: "Categoria",
			costPrice: "Preço de custo",
			salePrice: "Preço de venda",
			stock: "Estoque",
			minStock: "Estoque mínimo",
			supplier: "Fornecedor",
			stockStatus: "Status de estoque",
			actions: "Editar",
		},
	},
	form: {
		skuLabel: "SKU",
		skuPlaceholder: "TEL-IP13-OLED",
		nameLabel: "Nome",
		namePlaceholder: "Tela OLED iPhone 13",
		categoryLabel: "Categoria",
		categoryPlaceholder: "Selecione uma categoria",
		supplierLabel: "Fornecedor",
		supplierPlaceholder: "Selecione um fornecedor",
		costPriceLabel: "Preço de custo (R$)",
		salePriceLabel: "Preço de venda (R$)",
		stockLabel: "Estoque",
		minStockLabel: "Estoque mínimo",
		minStockDescription:
			"Abaixo ou igual a esse valor a peça aparece como estoque baixo.",
		submit: "Cadastrar peça",
		created: "Peça cadastrada com sucesso!",
		updated: "Peça atualizada com sucesso!",
	},
};
