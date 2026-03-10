import { cookieKey } from "@fixr/constants/cookies";
import type { jwtPayload } from "@fixr/schemas/auth";
import { Elysia } from "elysia";
import type { z } from "zod";
import { verifyJWT } from "../helpers/jwt";
import { apiResponse } from "../helpers/response";
import { queryUserById } from "../services/auth.services";

type JwtPayload = z.infer<typeof jwtPayload>;

declare module "elysia" {
	interface Types {
		Derive: {
			userJwt: JwtPayload;
		};
	}
}

export const authenticateEmployee = new Elysia({
	name: "authenticate-employee",
}).derive(async ({ cookie, set }) => {
	const token = cookie[cookieKey("session")]?.value as string | undefined;
	if (!token) {
		set.status = 401;
		return {
			user: null,
			userJwt: null,
			error: apiResponse({
				status: 401,
				error: "Unauthorized",
				code: "unauthorized",
				message: "Missing session token",
				data: null,
			}),
		};
	}

	const result = await verifyJWT(token);
	if (!result.payload || result.expired) {
		set.status = 401;
		return {
			user: null,
			userJwt: null,
			error: apiResponse({
				status: 401,
				error: "Unauthorized",
				code: "invalid_token",
				message: "Invalid or expired session token",
				data: null,
			}),
		};
	}

	const user = await queryUserById(result.payload.id);
	if (!user) {
		set.status = 404;
		return {
			user: null,
			userJwt: null,
			error: apiResponse({
				status: 404,
				error: "Not Found",
				code: "user_not_found",
				message: "User not found",
				data: null,
			}),
		};
	}

	if (user.profileType !== "employee") {
		set.status = 403;
		return {
			user: null,
			userJwt: null,
			error: apiResponse({
				status: 403,
				error: "Forbidden",
				code: "not_allowed",
				message: "You are not allowed to perform this action.",
				data: null,
			}),
		};
	}

	return { user, userJwt: result.payload as JwtPayload, error: null };
});
