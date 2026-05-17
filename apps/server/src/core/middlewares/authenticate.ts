import type { Context } from "elysia";
import { AuthRepository } from "../../modules/auth/repositories";
import { AppError } from "../lib/app-error";

/** @description Verify JWT token from Authorization header or session cookie */
export const authenticate = async (ctx: Context) => {
	const authHeader = ctx.request.headers.get("authorization");
	const ctxJwt = ctx as Context & {
		jwt: { verify: (t: string) => Promise<object | false> };
	};
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: (ctx.cookie as Record<string, { value: string }>)?.session?.value;

	if (!token) {
		throw new AppError("AUTH_JWT_INVALID");
	}

	const payload = await ctxJwt.jwt.verify(token);
	if (!payload) {
		throw new AppError("AUTH_JWT_INVALID");
	}

	(ctx as Context & { user: object }).user = payload;

	const { id } = payload as Record<string, string>;

	const user = await AuthRepository.queryUserById(id);
	if (!user) {
		throw new AppError("RESOURCE_NOT_FOUND");
	}
};
