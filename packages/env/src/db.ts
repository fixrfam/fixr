import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

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
