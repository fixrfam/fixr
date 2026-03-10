import type { userJWT } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";

export type AuthenticatedContext = Context & {
	userJwt: z.infer<typeof userJWT>;
	cookie: Record<string, { value: string }>;
};

export function getAuthContext(ctx: Context): AuthenticatedContext {
	return ctx as unknown as AuthenticatedContext;
}
