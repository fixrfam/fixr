import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../../apps/admin/.env") });

export const env = createEnv({
	server: {
		CLERK_SECRET_KEY: z.string().describe("Clerk secret key for server-side"),
		REDIS_URL: z.url().describe("Redis connection URL"),
		FRONTEND_URL: z.url().describe("Frontend URL for redirects"),
	},
	client: {
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
			.string()
			.describe("Clerk publishable key for client-side"),
		NEXT_PUBLIC_API_URL: z.url().describe("Backend API URL"),
	},
	clientPrefix: "NEXT_PUBLIC_",
	runtimeEnv: {
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		REDIS_URL: process.env.REDIS_URL,
		FRONTEND_URL: process.env.FRONTEND_URL,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
	emptyStringAsUndefined: true,
});
