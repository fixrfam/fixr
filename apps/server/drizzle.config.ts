import type { Config } from "drizzle-kit";
import { env } from "./src/env";

export default {
    schema: "./src/db/schema/index.ts",
    dialect: "postgresql",
    out: "./drizzle",
    dbCredentials: {
        url: env.DB_URL,
    },
} satisfies Config;
