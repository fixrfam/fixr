import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../../apps/server/.env") });

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
		ADMIN_URL: z.url().describe("Admin panel URL for CORS"),
		CLERK_SECRET_KEY: z
			.string()
			.min(1)
			.describe("Clerk secret key for admin JWT verification"),
		TURNSTILE_SECRET_KEY: z
			.string()
			.min(1)
			.describe("Cloudflare Turnstile secret key"),
		R2_ACCESS_KEY_ID: z.string().min(1).describe("Cloudflare R2 access key ID"),
		R2_SECRET_ACCESS_KEY: z
			.string()
			.min(1)
			.describe("Cloudflare R2 secret access key"),
		R2_BUCKET_URL: z
			.url()
			.describe(
				"R2 S3 API URL including bucket path (e.g. https://<account>.r2.cloudflarestorage.com/<bucket>)"
			),
		R2_PUBLIC_BASE_URL: z
			.url()
			.describe(
				"Public base URL for uploaded objects (R2 public bucket or custom domain, no trailing slash)"
			),
		R2_REGION: z
			.string()
			.default("auto")
			.describe("R2 region (use auto for Cloudflare)"),
		R2_PRESIGN_EXPIRES_IN: z.coerce
			.number()
			.int()
			.min(60)
			.max(3600)
			.default(600)
			.describe("Pre-signed upload URL TTL in seconds"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
