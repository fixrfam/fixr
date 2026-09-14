import { type Ability, createAbility } from "@fixr/permissions";
import type { Permission } from "@fixr/permissions/permissions";
import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "../../config/redis";
import { ApiKeysRepository } from "../../modules/api-keys/repositories";
import { parseApiKey, verifyApiKeySecret } from "../lib/api-key";
import { AppError } from "../lib/app-error";

/**
 * Minimum interval between `last_used_at` writes for the same key.
 *
 * Without this every authenticated request would issue an UPDATE, turning a
 * read-only call into a write and putting one row under constant contention.
 */
const LAST_USED_THROTTLE_SECONDS = 60;

/**
 * Extracts the raw token from the request.
 *
 * Accepts `Authorization: Bearer <token>` and the `x-api-key` header, so
 * integrations can use whichever their HTTP client makes easier.
 *
 * @param request - The incoming request
 * @returns The raw token, or null when absent
 */
function extractToken(request: FastifyRequest): string | null {
	const headerKey = request.headers["x-api-key"];

	if (typeof headerKey === "string" && headerKey.length > 0) {
		return headerKey;
	}

	const authorization = request.headers.authorization;

	if (authorization?.startsWith("Bearer ")) {
		return authorization.slice("Bearer ".length);
	}

	return null;
}

/**
 * Builds the ability a key may exercise.
 *
 * The role is resolved from the employee on every request, then intersected
 * with the key's scopes. A scope can therefore only remove permissions: if the
 * employee is demoted, every key they issued narrows with them.
 *
 * @param role - The owning employee's current role
 * @param scopes - The scopes stored on the key
 * @returns An ability limited to the intersection
 */
function buildKeyAbility(
	role: Parameters<typeof createAbility>[0],
	scopes: string[]
): Ability {
	const roleAbility = createAbility(role);

	if (scopes.length === 0) {
		return roleAbility;
	}

	const granted = roleAbility.permissions.filter((permission) =>
		scopes.includes(permission)
	);

	return {
		can: (permission: Permission) => granted.includes(permission),
		cannot: (permission: Permission) => !granted.includes(permission),
		permissions: granted,
	};
}

/**
 * Records usage at most once per throttle window.
 *
 * Uses SET NX as a distributed lock so concurrent requests across instances
 * still produce a single write. Failures are swallowed: usage telemetry must
 * never break an otherwise valid request.
 *
 * @param apiKeyId - The key that was used
 */
async function touchLastUsed(apiKeyId: string): Promise<void> {
	try {
		const acquired = await redis.set(
			`api-keys:touched:${apiKeyId}`,
			"1",
			"EX",
			LAST_USED_THROTTLE_SECONDS,
			"NX"
		);

		if (acquired === "OK") {
			await ApiKeysRepository.touchLastUsedAt(apiKeyId);
		}
	} catch {
		// Telemetry is best-effort.
	}
}

/**
 * Authenticates a request presenting an integration API key.
 *
 * Resolves the key by its public prefix in a single indexed query, verifies the
 * secret in constant time, then rejects revoked or expired keys before
 * populating `request.user` and `request.ability` the same way the JWT flow does.
 */
export const authenticateApiKey = async (
	request: FastifyRequest,
	_response: FastifyReply
): Promise<void> => {
	const token = extractToken(request);

	if (!token) {
		throw new AppError("API_KEY_CREDENTIALS_INVALID");
	}

	const parsed = parseApiKey(token);

	if (!parsed) {
		throw new AppError("API_KEY_CREDENTIALS_INVALID");
	}

	const apiKey = await ApiKeysRepository.getByPrefix(parsed.prefix);

	if (!(apiKey && verifyApiKeySecret(parsed.secret, apiKey.keyHash))) {
		throw new AppError("API_KEY_CREDENTIALS_INVALID");
	}

	if (apiKey.revokedAt) {
		throw new AppError("API_KEY_REVOKED");
	}

	if (apiKey.expiresAt && new Date(apiKey.expiresAt) <= new Date()) {
		throw new AppError("API_KEY_EXPIRED");
	}

	request.user = {
		id: apiKey.userId,
		email: apiKey.userEmail,
		displayName: apiKey.employeeName,
		avatarUrl: apiKey.userAvatarUrl,
		profileType: "employee",
		company: {
			id: apiKey.companyId,
			name: apiKey.companyName,
			subdomain: apiKey.companySubdomain,
			role: apiKey.employeeRole,
		},
		createdAt: apiKey.userCreatedAt,
	};

	request.apiKey = { id: apiKey.id, prefix: apiKey.prefix };
	request.ability = buildKeyAbility(apiKey.employeeRole, apiKey.scopes);

	await touchLastUsed(apiKey.id);
};

declare module "fastify" {
	interface FastifyRequest {
		/** Present only when the request authenticated with an integration key. */
		apiKey?: { id: string; prefix: string };
	}
}
