import { jwtPayload, type loginUserSchema } from "@fixr/schemas/auth";
import bcrypt from "bcryptjs";
import type { z } from "zod";
import { apiResponse } from "@/src/helpers/response";
import { signJWT } from "../../helpers/jwt";
import { generateRefreshToken } from "../../helpers/tokens";
import {
	queryJWTPayloadByUserId,
	queryUserByEmail,
} from "../../services/auth.services";
import { setJWTCookie, setRefreshToken } from "../../services/tokens.services";

export async function loginHandler({
	body,
	cookie,
}: {
	body: z.infer<typeof loginUserSchema>;
	cookie: Record<string, { value: string }>;
}) {
	const email = body.email.toLowerCase();
	const user = await queryUserByEmail(email);

	if (!user) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not Found",
				code: "user_not_found",
				message: "User not found",
				data: null,
			}),
		} as const;
	}

	if (!user.verified) {
		return {
			status: 403,
			response: apiResponse({
				status: 403,
				error: "Forbidden",
				code: "email_not_verified",
				message: "Email not verified",
				data: null,
			}),
		} as const;
	}

	const validPassword = await bcrypt.compare(body.password, user.passwordHash);

	if (!validPassword) {
		return {
			status: 401,
			response: apiResponse({
				status: 401,
				error: "Unauthorized",
				code: "invalid_password",
				message: "Invalid password",
				data: null,
			}),
		} as const;
	}

	const payload = await queryJWTPayloadByUserId(user.id);
	const token = await signJWT({ payload: jwtPayload.parse(payload) });
	const refreshToken = generateRefreshToken();

	await setRefreshToken(cookie, refreshToken, user.id);
	setJWTCookie(cookie, token);

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "login_success",
			message: "Logged in successfully",
			data: { token },
		}),
	} as const;
}
