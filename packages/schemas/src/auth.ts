import { z } from "zod";

export const createUserSchema = z.object({
    email: z
        .string({ required_error: "Email is required." })
        .email({ message: "Invalid email address" }),
    password: z
        .string({ required_error: "Password is required." })
        .min(8)
        .max(128)
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
            message:
                "Password needs to contain one uppercase character, one lowercase character, one number, one special character and be at least 8 length.",
        }),
    displayName: z
        .string()
        .transform((value) => (value.trim() === "" ? undefined : value)) // Handle empty strings
        .optional()
        //The transform conflicts with string length, so we can't use the min and max methods here
        .refine((value) => value === undefined || value.length >= 3, {
            message: "Name must be at least 3 characters.",
        })
        .refine((value) => value === undefined || value.length <= 64, {
            message: "Name too long.",
        }),
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const nonSensitiveUser = z
    .object({
        id: z.string().cuid2(),
        email: z.string().email({ message: "Invalid email address" }),
        displayName: z.string().min(3).max(100).nullable(),
        createdAt: z.coerce.date(),
    })
    .describe(
        "Representing the user object, contains only non-sentitive data. User password will **NEVER** be returned in responses, not even in hashed format."
    );

export const userJWT = nonSensitiveUser.extend({
    iat: z.number(),
    exp: z.number(),
});

export const verifyEmailSchema = z.object({
    token: z.string(),
    redirectUrl: z.string().optional(),
});
