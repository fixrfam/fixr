import { createHash, randomBytes } from "node:crypto";

/** Bytes of entropy in a link or session token (43 base64url chars). */
const TOKEN_BYTES = 32;

/**
 * Random token for a link or a session. Only its hash is stored (see
 * `hashOpaqueToken`), so the database alone can't produce a working token.
 */
export function generateOpaqueToken() {
	return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 (hex) of a token, which is what the database stores and looks up. */
export function hashOpaqueToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
