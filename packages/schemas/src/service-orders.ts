import { cpf, formattedImei, openData, openHora } from "@fixr/schemas/common";
import { z } from "zod";

export const createOrderServiceSchema = z.object({
	customerCpf: cpf.min(1, "O CPF é obrigatório"),
	customerImei: formattedImei.optional(),
	openData: openData.min(1, "A data de abertura é obrigatória"),
	openHora: openHora.min(1, "A hora de abertura é obrigatória"),
	descricao: z.string().min(1, "A descrição do problema é obrigatória"),
	observacoes: z.string().optional(),
	marcaId: z.string().min(1, "Selecione a marca do aparelho"),
	categoriaId: z.string().min(1, "Selecione a categoria do aparelho"),
	modeloId: z.string().min(1, "Selecione o modelo do aparelho"),
	creatorEmployeeId: z
		.string()
		.min(1, "O ID do funcionário criador é obrigatório"),
	// ... outros campos como data, marca, etc.
});
