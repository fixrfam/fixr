import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		REDIS_URL: z.url().describe("Redis connection URL"),
		JWT_SECRET: z.string().min(32).describe("JWT signing secret"),
		COOKIE_ENCRYPTION_SECRET: z
			.string()
			.min(32)
			.describe("Cookie encryption secret"),
		COOKIE_DOMAIN: z.string().describe("Domain for cookies"),
		GOOGLE_AUTH_CLIENT_ID: z
			.string()
			.describe("Google OAuth client ID (legacy)"),
		GOOGLE_AUTH_CLIENT_SECRET: z
			.string()
			.describe("Google OAuth client secret"),
		GOOGLE_AUTH_REDIRECT_URI: z.url().describe("Google OAuth redirect URI"),
		NODE_PORT: z.coerce.number().describe("Node.js server port"),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development")
			.describe("Node environment"),
		FRONTEND_URL: z.url().describe("Frontend application URL"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
