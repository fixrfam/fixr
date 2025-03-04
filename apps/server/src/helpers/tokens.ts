import crypto from "crypto";

import { RefreshToken } from "../services/tokens.services";

export function generateRefreshToken(): RefreshToken {
    const refreshToken = {
        token: crypto.randomBytes(64).toString("base64url"),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Adds 7 days to the current date
    };

    return refreshToken;
}

export function generateOneTimeToken(): string {
    return crypto.randomBytes(64).toString("base64url");
}
