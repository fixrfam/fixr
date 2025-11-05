import type { Config } from "drizzle-kit"
import { env } from "./env"

export default {
  schema: "./src/schema/index.ts",
  dialect: "mysql",
  out: "./drizzle",
  dbCredentials: {
    url: env.DB_URL,
  },
} satisfies Config
