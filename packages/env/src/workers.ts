import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import "./load-root-env";

export const env = createEnv({
	server: {
		REDIS_URL: z.url().describe("Redis connection URL"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
