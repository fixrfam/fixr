import { fastifyCookie } from "@fastify/cookie";
import { fastifyJwt } from "@fastify/jwt";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import { fastify } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { registerErrorHandler } from "@/src/app";

/**
 * A bare Fastify instance with the same JWT/cookie/error-handler wiring as
 * `buildApp()` but no module routes, so middleware specs can register a
 * throwaway route and exercise the real hook pipeline via `inject()`.
 */
export async function createMiddlewareApp() {
	const app = fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
	registerErrorHandler(app);
	await app.register(fastifyJwt, {
		secret: env.JWT_SECRET,
		cookie: { cookieName: cookieKey("session"), signed: false },
	});
	await app.register(fastifyCookie, { secret: env.COOKIE_ENCRYPTION_SECRET });
	return app;
}
