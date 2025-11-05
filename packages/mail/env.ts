import { config } from "dotenv"
import { z } from "zod"

config()
const envSchema = z.object({
  RESEND_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
