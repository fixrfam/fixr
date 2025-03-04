import { z } from "zod";

export const editAccountSchema = z
    .object({
        displayName: z
            .string()
            .min(3, { message: "Must be at least 3 characters long." })
            .max(64, { message: "Oops! Too long..." })
            .optional(),
    })
    .refine(
        (data: { [key: string]: string }) =>
            Object.keys(data).some((key) => data[key] !== undefined),
        {
            message: "At least one field must be provided",
        }
    );

export const confirmAccountDeletionSchema = z.object({
    token: z.string(),
    redirectUrl: z.string().optional(),
});
