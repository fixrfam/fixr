import { config } from "dotenv"
import { z } from "zod"

config()
const envSchema = z.object({
  DB_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
