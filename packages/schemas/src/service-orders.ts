import { cpf, formattedIMEI } from "@fixr/schemas/common";
import { z } from "zod";

export const createOrderServiceSchema = z.object({
	customerCPF: cpf.min(1, "O CPF é obrigatório"),
	deviceIMEI: formattedIMEI.optional(),
	description: z.string().min(1, "A descrição do problema é obrigatória"),
	notes: z.string().optional(),
	deviceId: z.string().min(1, "Selecione o modelo do aparelho"),
	assigned_to: z
		.string()
		.min(1, "Selecione o funcionário responsável pela ordem de serviço"),
	images: z
		.array(z.instanceof(File))
		.min(3, "Adicione pelo menos três fotos do aparelho")
		.max(15, "Adicione no máximo quinze fotos do aparelho"),
});
