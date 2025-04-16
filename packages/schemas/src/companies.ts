import { z } from "zod";
import { passwordSchema } from "./auth";
import { cnpj, cpf } from "./common";

export const createCompanySchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters long." })
        .max(100, { message: "Name must be at most 100 characters long." }),
    cnpj: cnpj,
    address: z
        .string()
        .min(3, { message: "Address must be at least 3 characters long." })
        .max(255, { message: "Address must be at most 255 characters long." })
        .optional()
        .or(z.literal("")),
    subdomain: z
        .string()
        .min(1, { message: "Subdomain must be at least 1 character long." })
        .max(63, { message: "Subdomain must be at most 63 characters long." })
        .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
            message:
                "Subdomain can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-), but cannot start or end with a hyphen",
        }),
    owner_cpf: cpf,
    owner_email: z.string().email({ message: "Invalid email address." }),
    owner_password: passwordSchema,
});

export const getCompanyByIdSchema = z.object({
    id: z.string().cuid2(),
});
