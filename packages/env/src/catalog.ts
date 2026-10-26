import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import "./load-root-env";

/**
 * Settings of the shared catalog import (`packages/db/src/catalog`). R2 is
 * only needed to upload images, so every value is optional here and the
 * import checks them when it uploads.
 */
export const env = createEnv({
	server: {
		R2_ACCESS_KEY_ID: z.string().min(1).optional(),
		R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		R2_BUCKET_URL: z
			.url()
			.optional()
			.describe("R2 S3 API URL including the bucket path"),
		R2_PUBLIC_BASE_URL: z
			.url()
			.optional()
			.describe("Public base URL of the bucket, stored on upload records"),
		R2_REGION: z.string().default("auto"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
