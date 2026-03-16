import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../../apps/workers/.env") });

export const env = createEnv({
	server: {
		REDIS_URL: z.url().describe("Redis connection URL"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
