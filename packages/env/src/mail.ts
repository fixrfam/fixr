import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		RESEND_KEY: z.string().describe("Resend API key"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
