import { z } from "zod";

export const changePasswordAuthenticatedSchema = z.object({
    old: z.string(),
    new: z
        .string()
        .min(8)
        .max(128)
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
            message:
                "Password needs to contain one uppercase character, one lowercase character, one number, one special character and be at least 8 length.",
        }),
});

export const requestPasswordResetSchema = z.object({
    email: z.string().email(),
});

export const confirmPasswordResetSchema = z.object({
    token: z.string(),
    password: z
        .string({ required_error: "Password is required." })
        .min(8)
        .max(128)
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
            message:
                "Password needs to contain one uppercase character, one lowercase character, one number, one special character and be at least 8 length.",
        }),
});
