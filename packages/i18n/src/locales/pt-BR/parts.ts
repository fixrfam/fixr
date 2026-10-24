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
			actions: "Ações",
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
		stockLockedDescription:
			"Altere o estoque pelo Ajustar estoque na lista de peças.",
	},
	stockAdjustment: {
		trigger: "Ajustar estoque",
		triggerLabel: "Ajustar o estoque de {{name}}",
		title: "Ajustar estoque",
		description: "Adicione ou remova unidades de {{name}}.",
		deltaLabel: "Unidades",
		deltaDescription: "Use um número negativo para remover unidades.",
		preview: "O estoque vai de {{current}} para {{next}}.",
		submit: "Salvar ajuste",
		success: "Estoque ajustado!",
	},
};
