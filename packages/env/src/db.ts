import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the db package directory
config({ path: join(__dirname, "../../db/.env") });

export const env = createEnv({
	server: {
		DB_URL: z.url().describe("Database connection URL (legacy)"),
		MYSQL_ROOT_PASSWORD: z.string().describe("MySQL root password"),
		MYSQL_DATABASE: z.string().describe("MySQL database name"),
		MYSQL_USER: z.string().describe("MySQL username"),
		MYSQL_PASSWORD: z.string().describe("MySQL password"),
		REDIS_PASSWORD: z.string().describe("Redis password"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
