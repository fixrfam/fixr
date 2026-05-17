import { env } from "@fixr/env/server";
import type { jwtPayload } from "@fixr/schemas/auth";
import jwt from "jsonwebtoken";
import type { z } from "zod";

/** @description Sign a JWT token with the given payload */
export function signJWT({
	payload,
	expiresIn,
}: {
	payload: z.infer<typeof jwtPayload>;
	expiresIn?: string | number;
}): string {
	return jwt.sign(payload as object, env.JWT_SECRET, {
		expiresIn: expiresIn ?? "300s",
	} as jwt.SignOptions);
}
