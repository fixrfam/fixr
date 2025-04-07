import { z } from "zod";
import { employeeRoles } from "./employee";

export const accountSchema = z
    .object({
        id: z.string().cuid2(),
        email: z.string().email({ message: "Invalid email address" }),
        displayName: z.string().min(3).max(100).nullable(),
        cpf: z.string().length(11),
        phone: z.string().length(11).nullable(),
        profileType: z.union([z.literal("client"), z.literal("employee")]),
        company: z
            .object({
                id: z.string().cuid2(),
                name: z.string(),
                subdomain: z.string(),
                role: employeeRoles,
            })
            .optional(),
        createdAt: z.coerce.date(),
    })
    .describe(
        "The account object, contains only non-sentitive data. User password will **NEVER** be returned in responses, not even in hashed format."
    );

export const confirmAccountDeletionSchema = z.object({
    token: z.string(),
    redirectUrl: z.string().optional(),
});
