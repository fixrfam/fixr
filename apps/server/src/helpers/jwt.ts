import { env } from "@fixr/env/server";
import type { jwtPayload } from "@fixr/schemas/auth";
import { jwtVerify, SignJWT } from "jose";
import type { z } from "zod";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signJWT({
	payload,
	expiresIn,
}: {
	payload: z.infer<typeof jwtPayload>;
	expiresIn?: string;
}): Promise<string> {
	return await new SignJWT(payload as Record<string, unknown>)
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime(expiresIn ?? "300s")
		.setIssuedAt()
		.sign(secret);
}

export async function verifyJWT(token: string) {
	try {
		const { payload } = await jwtVerify(token, secret);
		return { payload: payload as z.infer<typeof jwtPayload>, expired: false };
	} catch {
		return { payload: null, expired: true };
	}
}
