import { config } from "dotenv";
import { z } from "zod";

config();
const envSchema = z.object({
    DB_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string(),
    COOKIE_ENCRYPTION_SECRET: z.string(),
    COOKIE_DOMAIN: z.string(),
    NODE_PORT: z.string(),
    FRONTEND_URL: z.string().url(),
    REDIS_PASSWORD: z.string(),
    GOOGLE_AUTH_CLIENT_ID: z.string(),
    GOOGLE_AUTH_CLIENT_SECRET: z.string(),
    GOOGLE_AUTH_REDIRECT_URI: z.string().url(),
});

export const env = envSchema.parse(process.env);
