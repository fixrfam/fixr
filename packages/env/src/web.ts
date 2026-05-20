import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_API_URL: z.url().describe("Backend API URL"),
		NEXT_PUBLIC_APP_URL: z.url().describe("Frontend application URL"),
		NEXT_PUBLIC_DOCS_URL: z.url().describe("Documentation URL"),
		NEXT_PUBLIC_LINKTREE_URL: z.url().describe("Linktree URL"),
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
			.string()
			.min(1)
			.describe("Cloudflare Turnstile site key"),
	},
	clientPrefix: "NEXT_PUBLIC_",
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
		NEXT_PUBLIC_LINKTREE_URL: process.env.NEXT_PUBLIC_LINKTREE_URL,
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
	},
	emptyStringAsUndefined: true,
});
