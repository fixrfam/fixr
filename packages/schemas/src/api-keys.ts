import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

/** Maximum lifetime we allow a caller to request, in days. */
export const API_KEY_MAX_TTL_DAYS = 365;

export const createApiKeySchema = z.object({
	name: z
		.string({ error: i18nMessage("validation.generic.required") })
		.min(3, { message: i18nMessage("validation.name.min", { count: 3 }) })
		.max(100, { message: i18nMessage("validation.name.max") }),
	/**
	 * Permissions the key may use. Always intersected with the creator's role,
	 * so a scope can only narrow access, never widen it.
	 * Omit or send an empty array to inherit the creator's role as-is.
	 */
	scopes: z.array(z.string()).max(64).optional().default([]),
	/** Optional expiration. When omitted the key never expires. */
	expiresAt: z.coerce
		.date()
		.min(new Date(), {
			message: i18nMessage("validation.apiKey.expirationInPast"),
		})
		.optional()
		.nullable(),
});

export const apiKeyIdParamsSchema = z.object({
	apiKeyId: z.string().cuid2(),
});

/**
 * Returned exactly once, right after creation.
 * `secret` is the only moment the plaintext key is ever available.
 */
export const createdApiKeySchema = z.object({
	id: z.string(),
	name: z.string(),
	prefix: z.string(),
	scopes: z.array(z.string()),
	expiresAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
	secret: z
		.string()
		.describe(
			"The plaintext key. Shown only on creation and never retrievable again."
		),
});
