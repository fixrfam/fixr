import type { ZodType } from "zod";

/** Paths of the issues a schema reports for `input`, e.g. `["email"]`. */
export function issuePaths(schema: ZodType, input: unknown) {
	const result = schema.safeParse(input);
	if (result.success) {
		return [];
	}
	return result.error.issues.map((issue) => issue.path.join("."));
}
