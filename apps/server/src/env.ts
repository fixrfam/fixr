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
});

export const env = envSchema.parse(process.env);
