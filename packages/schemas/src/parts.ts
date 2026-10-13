import { z } from "zod";
import { documentSchema } from "./documents";

export const createSupplierSchema = z.object({
	name: z
		.string()
		.min(1, "O nome é obrigatório")
		.max(120, "O nome excede 120 caracteres"),
	cnpj: documentSchema("cnpj").min(1, "O CNPJ é obrigatório"),
	contact: z.string().min(1, "O nome do contato é obrigatório"),
	phone: z.string().min(1, "O telefone é obrigatório"),
	email: z.string().min(1, "O email é obrigatório").email("Email inválido"),
});

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

export const createServiceSchema = z.object({
	name: z
		.string()
		.min(1, "O nome é obrigatório")
		.max(120, "O nome excede 120 caracteres"),
	description: z
		.string()
		.min(1, "A descrição é obrigatória")
		.max(500, "A descrição excede 500 caracteres"),
	estimatedDurationMinutes: z
		.number({ error: "Informe a duração estimada" })
		.int("A duração deve ser em minutos inteiros")
		.min(1, "A duração deve ser de pelo menos 1 minuto"),
	price: z
		.number({ error: "Informe o preço" })
		.min(0, "O preço não pode ser negativo"),
	partIds: z.array(z.string()),
	deviceCategories: z
		.array(z.string())
		.min(1, "Selecione ao menos uma categoria de aparelho"),
	testInstructions: z.array(
		z.string().min(1).max(200, "O tópico excede 200 caracteres")
	),
	testParameters: z.array(
		z.string().min(1).max(200, "O tópico excede 200 caracteres")
	),
});
