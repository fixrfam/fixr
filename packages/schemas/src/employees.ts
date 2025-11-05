import { z } from "zod"
import { passwordSchema } from "./auth"
import { cpf } from "./common"
import { employeeRoles } from "./roles"

export const createEmployeeSchema = z.object({
  name: z
    .string({ required_error: "Preencha este campo" })
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres." })
    .max(100, { message: "Ops! Nome muito grande..." }),
  cpf: cpf,
  phone: z
    .string()
    .length(11, { message: "Telefone incompleto." })
    .optional()
    .nullable(),
  role: employeeRoles,
  email: z
    .string({ required_error: "Preencha este campo" })
    .email({ message: "Email inválido" }),
  password: passwordSchema.optional(),
})
