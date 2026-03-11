import { env } from "@fixr/env/db";
import type { Config } from "drizzle-kit";

export default {
	schema: "./src/schema/index.ts",
	dialect: "mysql",
	out: "./drizzle",
	dbCredentials: {
		url: env.DB_URL,
	},
} satisfies Config;
