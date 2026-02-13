import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_SERVER_URL: z.url(),
	},
	// biome-ignore lint/suspicious/noExplicitAny: <This is needed on Vite runtime env>
	runtimeEnv: (import.meta as any).env,
	emptyStringAsUndefined: true,
});
