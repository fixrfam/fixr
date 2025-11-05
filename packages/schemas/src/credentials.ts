import { z } from "zod"
import { passwordSchema } from "./auth"

export const changePasswordAuthenticatedSchema = z.object({
  old: z.string(),
  new: passwordSchema,
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
})

export const confirmPasswordResetSchema = z.object({
  token: z.string(),
  password: passwordSchema,
})
