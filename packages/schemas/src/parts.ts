import { z } from "zod";

export const createPartSchema = z
	.object({
		sku: z
			.string()
			.min(1, "O SKU é obrigatório")
			.max(50, "O SKU excede 50 caracteres"),
		name: z
			.string()
			.min(1, "O nome é obrigatório")
			.max(120, "O nome excede 120 caracteres"),
		category: z.string().min(1, "Selecione a categoria"),
		costPrice: z
			.number({ error: "Informe o preço de custo" })
			.min(0, "O preço de custo não pode ser negativo"),
		salePrice: z
			.number({ error: "Informe o preço de venda" })
			.min(0, "O preço de venda não pode ser negativo"),
		stock: z
			.number({ error: "Informe o estoque" })
			.int("O estoque deve ser um número inteiro")
			.min(0, "O estoque não pode ser negativo"),
		minStock: z
			.number({ error: "Informe o estoque mínimo" })
			.int("O estoque mínimo deve ser um número inteiro")
			.min(0, "O estoque mínimo não pode ser negativo"),
		supplierId: z.string().min(1, "Selecione o fornecedor"),
	})
	.refine((data) => data.salePrice >= data.costPrice, {
		message: "O preço de venda deve ser maior ou igual ao preço de custo",
		path: ["salePrice"],
	});
