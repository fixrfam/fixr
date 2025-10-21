import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
  cpf: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
  phone: z.string().min(1, "O telefone é obrigatório"),
  alternativePhone: z.string().optional(),
  address: z.string().min(1, "O endereço é obrigatório"),
  state: z.string().min(2, "O estado é obrigatório").max(2),
  city: z.string().min(1, "A cidade é obrigatória"),
});

