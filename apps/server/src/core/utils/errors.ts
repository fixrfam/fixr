import { z } from "zod";

export const errorSchema = z.object({
	code: z.string(),
	message: z.string(),
	status: z.number(),
});

export type AppErrorDefinition = z.infer<typeof errorSchema>;

/**
 * Strictly type-safe error registry helper.
 * Enforces required props (code, message, status)
 * and preserves IntelliSense for keys and values.
 */
export const defineErrors = <
	const T extends Record<string, AppErrorDefinition>,
>(
	errors: T
) => errors;
