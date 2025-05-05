import { z } from "zod";
import { passwordSchema } from "./auth";
import { cpf } from "./common";
import { employeeRoles } from "./roles";

export const createEmployeeSchema = z.object({
    name: z.string().min(3).max(100),
    cpf: cpf,
    phone: z.string().length(11).optional(),
    role: employeeRoles,
    email: z.string().email({ message: "Invalid email address" }),
    password: passwordSchema.optional(),
});
