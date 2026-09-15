import crypto from "node:crypto";
import { env } from "@fixr/env/server";

/** Human-readable marker so a leaked key is recognisable in logs and scanners. */
const API_KEY_NAMESPACE = "fxr";

/** Bytes of entropy for the public lookup handle. 9 bytes -> 12 base64url chars. */
const PREFIX_BYTES = 9;

/** Bytes of entropy for the secret portion. 32 bytes -> 43 base64url chars. */
const SECRET_BYTES = 32;

export interface GeneratedApiKey {
	/** Public handle stored in the database and safe to display. */
	prefix: string;
	/** HMAC of the secret. The only representation persisted. */
	keyHash: string;
	/** Full plaintext token. Returned to the caller once and never stored. */
	token: string;
}

/**
 * Derives the stored representation of a secret.
 *
 * API key secrets carry 256 bits of entropy, so unlike user passwords they do
 * not need a slow KDF: an attacker cannot feasibly brute-force the keyspace
 * regardless of hash speed. A keyed HMAC keeps verification at microseconds
 * (instead of ~100ms with bcrypt) and makes the stored hashes useless to anyone
 * who dumps the table without also holding `API_KEY_SECRET`.
 *
 * @param secret - The plaintext secret portion of the token
 * @returns Hex-encoded HMAC-SHA256 of the secret
 */
export function hashApiKeySecret(secret: string): string {
	return crypto
		.createHmac("sha256", env.API_KEY_SECRET)
		.update(secret)
		.digest("hex");
}

/**
 * Compares a candidate secret against a stored hash in constant time.
 *
 * @param secret - The plaintext secret supplied by the caller
 * @param keyHash - The hash persisted for the key
 * @returns Whether the secret matches
 */
export function verifyApiKeySecret(secret: string, keyHash: string): boolean {
	const candidate = Buffer.from(hashApiKeySecret(secret), "hex");
	const expected = Buffer.from(keyHash, "hex");

	if (candidate.length !== expected.length) {
		return false;
	}

	return crypto.timingSafeEqual(candidate, expected);
}

/**
 * Generates a new API key.
 *
 * The token layout is `fxr_<prefix>_<secret>`: the prefix is a uniquely indexed
 * handle that lets authentication resolve the row in a single query, and only
 * then verify the secret.
 *
 * @returns The public prefix, the hash to persist and the plaintext token
 */
export function generateApiKey(): GeneratedApiKey {
	const prefix = crypto.randomBytes(PREFIX_BYTES).toString("base64url");
	const secret = crypto.randomBytes(SECRET_BYTES).toString("base64url");

	return {
		prefix,
		keyHash: hashApiKeySecret(secret),
		token: `${API_KEY_NAMESPACE}_${prefix}_${secret}`,
	};
}

/**
 * Extracts the raw token from request headers.
 *
 * Accepts `Authorization: Bearer <token>` and the `x-api-key` header, so
 * integrations can use whichever their HTTP client makes easier.
 *
 * @param headers - The incoming request headers
 * @returns The raw token, or null when absent
 */
export function extractApiKeyToken(headers: {
	authorization?: string;
	"x-api-key"?: string | string[];
}): string | null {
	const headerKey = headers["x-api-key"];

	if (typeof headerKey === "string" && headerKey.length > 0) {
		return headerKey;
	}

	const authorization = headers.authorization;

	if (authorization?.startsWith("Bearer ")) {
		return authorization.slice("Bearer ".length);
	}

	return null;
}

/**
 * Splits a token back into its prefix and secret.
 *
 * @param token - The raw token supplied by the caller
 * @returns The parsed parts, or null when the token is malformed
 */
export function parseApiKey(
	token: string
): { prefix: string; secret: string } | null {
	const parts = token.split("_");

	if (parts.length !== 3) {
		return null;
	}

	const [namespace, prefix, secret] = parts;

	if (namespace !== API_KEY_NAMESPACE || !prefix || !secret) {
		return null;
	}

	return { prefix, secret };
}
