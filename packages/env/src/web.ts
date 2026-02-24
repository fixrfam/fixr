import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_API_URL: z.url().describe("Backend API URL"),
		NEXT_PUBLIC_APP_URL: z.url().describe("Frontend application URL"),
		NEXT_PUBLIC_DOCS_URL: z.url().describe("Documentation URL"),
		NEXT_PUBLIC_LINKTREE_URL: z.url().describe("Linktree URL"),
	},
	clientPrefix: "NEXT_PUBLIC_",
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
		NEXT_PUBLIC_LINKTREE_URL: process.env.NEXT_PUBLIC_LINKTREE_URL,
	},
	emptyStringAsUndefined: true,
});
