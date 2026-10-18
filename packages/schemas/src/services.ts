import { z } from "zod";

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
