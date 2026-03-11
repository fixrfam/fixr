import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the mail package directory
config({ path: join(__dirname, "../../mail/.env") });

// Also load from the current working directory (for overrides)
config();

export const env = createEnv({
	server: {
		RESEND_KEY: z.string().describe("Resend API key"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
