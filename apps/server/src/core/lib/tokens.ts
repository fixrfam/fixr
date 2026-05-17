import crypto from "crypto";

export interface RefreshToken {
	token: string;
	expires: Date;
}

/** @description Generate a refresh token with a 7-day expiry */
export function generateRefreshToken(): RefreshToken {
	const refreshToken = {
		token: crypto.randomBytes(64).toString("base64url"),
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Adds 7 days to the current date
	};

	return refreshToken;
}

/** @description Generate a cryptographically random one-time token */
export function generateOneTimeToken(): string {
	return crypto.randomBytes(64).toString("base64url");
}
