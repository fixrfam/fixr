import type { JWT } from "@fastify/jwt";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { z } from "zod";

/**
 * The JWT signer registered by `@fastify/jwt` inside `buildApp()`.
 *
 * Kept as a module-level binding (instead of importing the server instance)
 * so this module has no import-time side effects and can be used by any app
 * instance, including the ones created in tests.
 */
let signer: JWT | null = null;

export function bindJWT(jwt: JWT) {
	signer = jwt;
}

function getSigner(): JWT {
	if (!signer) {
		throw new Error("JWT signer not initialized. Call buildApp() first.");
	}
	return signer;
}

export function signJWT({
	payload,
	expiresIn,
}: {
	payload: z.infer<typeof jwtPayload>;
	expiresIn?: string | number;
}): string {
	return getSigner().sign(payload, { expiresIn: expiresIn ?? "300s" });
}

export function verifyJWT(token: string) {
	try {
		const decoded = getSigner().verify(token);
		return { payload: decoded, expired: false };
	} catch {
		return { payload: null, expired: true };
	}
}
