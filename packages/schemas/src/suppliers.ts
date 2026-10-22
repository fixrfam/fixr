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
