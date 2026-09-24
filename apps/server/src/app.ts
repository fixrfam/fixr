import { join } from "node:path";
import { cwd } from "node:process";
import { fastifyCookie } from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { fastifyJwt } from "@fastify/jwt";
import { fastifyStatic } from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { companySelectSchema } from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import { accountSchema } from "@fixr/schemas/account";
import { apiResponseSchema } from "@fixr/schemas/utils";
import scalarUi from "@scalar/fastify-api-reference";
import { type FastifyServerOptions, fastify } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	isResponseSerializationError,
	jsonSchemaTransform,
	jsonSchemaTransformObject,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError, z } from "zod";
import { apiDescription } from "./core/docs/main";
import type { FastifyTypedInstance } from "./core/interfaces/fastify";
import { AppError } from "./core/lib/app-error";
import { bindJWT } from "./core/lib/jwt";
import { sendErrorResponse } from "./core/lib/response";
import { accountRoutes } from "./modules/account/routes";
import { authRoutes } from "./modules/auth/routes";
import { categoriesRoutes } from "./modules/categories/routes";
import { companiesRoutes } from "./modules/companies/routes";
import { credentialsRoutes } from "./modules/credentials/routes";
import { employeesRoutes } from "./modules/employees/routes";
import { healthRoutes } from "./modules/health/routes";
import { makersRoutes } from "./modules/makers/routes";
import { modelsRoutes } from "./modules/models/routes";
import { serviceOrdersRoutes } from "./modules/service-orders/routes";
import { uploadsRoutes } from "./modules/uploads/routes";

const envToLogger = {
	development: {
		transport: {
			target: "pino-pretty",
			options: {
				ignore: "pid,hostname",
				translateTime: "HH:MM:ss Z",
			},
		},
	},
	production: true,
	test: false,
};

export interface BuildAppOptions {
	/** Fastify logger config. Defaults to the pretty development logger. Pass `false` in tests. */
	logger?: FastifyServerOptions["logger"];
	/** Register Swagger, Scalar (`/docs`), Swagger UI (`/reference`) and `/openapi.json`. Defaults to `true`. */
	docs?: boolean;
}

const OPENAPI_TAGS = [
	{
		name: "Auth",
		description:
			"Routes used for authentication (register, login and confirmations)",
	},
	{
		name: "Account",
		description: "Edit account data or delete it through these routes.",
	},
	{
		name: "Credentials",
		description: "Change account credentials (password) in different ways.",
	},
	{
		name: "Companies",
		description: "Company management.",
	},
	{
		name: "Employees",
		description: "Manage company employees.",
	},
	{
		name: "Service Orders",
		description: "Manage company service orders.",
	},
	{
		name: "Uploads",
		description: "Pre-signed uploads to Cloudflare R2.",
	},
	{
		name: "Devices",
		description: "Device catalog management: categories, makers, and models.",
	},
	{
		name: "Health",
		description:
			"System health check endpoint for monitoring and orchestration probes.",
	},
];

function registerSchemas() {
	// The global registry throws on duplicate ids, and buildApp() may run more than once (tests).
	const entries = [
		[apiResponseSchema, "Response"],
		[accountSchema, "User"],
		[companySelectSchema, "Company"],
	] as const;

	for (const [schema, id] of entries) {
		if (!z.globalRegistry.has(schema)) {
			z.globalRegistry.add(schema, { id });
		}
	}
}

export function registerErrorHandler(app: FastifyTypedInstance) {
	app.setErrorHandler((error, request, reply) => {
		if (error instanceof AppError) {
			return error.send(reply);
		}

		if (error instanceof ZodError) {
			return sendErrorResponse(reply, {
				status: 400,
				error: "Bad Request",
				code: "bad_request",
				message: "Type validation failed",
				data: error.issues,
			});
		}

		if (hasZodFastifySchemaValidationErrors(error)) {
			return sendErrorResponse(reply, {
				status: 400,
				error: "Bad Request",
				code: "request_validation_error",
				message: "Request doesn't match the schema",
				data: {
					issues: error.validation,
					method: request.method,
					url: request.url,
				},
			});
		}

		if (isResponseSerializationError(error)) {
			return sendErrorResponse(reply, {
				status: 500,
				error: "Internal Server Error",
				code: "response_serialization_failed",
				message: "Response doesn't match the schema",
				data: error,
			});
		}

		return reply.send(error);
	});
}

/**
 * Build a fully configured Fastify instance (plugins, error handling and every
 * module route) without binding it to a port.
 *
 * `server.ts` is the process entrypoint that calls `listen()`. Tests call this
 * directly and use `app.inject()`.
 */
export async function buildApp(
	options: BuildAppOptions = {}
): Promise<FastifyTypedInstance> {
	const { logger = envToLogger.development, docs = true } = options;

	registerSchemas();

	const app = fastify({
		logger,
		allowErrorHandlerOverride: true,
	}).withTypeProvider<ZodTypeProvider>();

	//Set Zod as the default request/response data serializer
	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	registerErrorHandler(app);

	if (docs) {
		// @fastify/swagger must be registered before routes (route discovery).
		await app.register(fastifySwagger, {
			openapi: {
				info: {
					title: `${APP_NAME} API`,
					version: "1.0.0",
					summary: `${APP_NAME} API`,
					description: apiDescription,
				},
				tags: OPENAPI_TAGS,
				security: [],
				components: {
					securitySchemes: {
						JWT: {
							type: "http",
							scheme: "bearer",
							bearerFormat: "Bearer",
						},
					},
				},
			},
			transform: jsonSchemaTransform,
			transformObject: jsonSchemaTransformObject,
		});
	}

	await app.register(fastifyJwt, {
		secret: env.JWT_SECRET,
		cookie: {
			cookieName: cookieKey("session"),
			signed: false,
		},
	});
	bindJWT(app.jwt);

	await app.register(fastifyCookie, {
		secret: env.COOKIE_ENCRYPTION_SECRET,
	});

	await app.register(fastifyStatic, {
		root: join(cwd(), "public"),
		prefix: "/public/",
	});

	await app.register(healthRoutes);
	await app.register(authRoutes, { prefix: "/auth" });
	await app.register(accountRoutes, { prefix: "/account" });
	await app.register(credentialsRoutes, { prefix: "/credentials" });
	await app.register(companiesRoutes, { prefix: "/companies" });
	await app.register(employeesRoutes, {
		prefix: "/companies/:subdomain/employees",
	});
	await app.register(serviceOrdersRoutes, {
		prefix: "/companies/:subdomain/service-orders",
	});
	await app.register(categoriesRoutes, {
		prefix: "/companies/:subdomain/categories",
	});
	await app.register(makersRoutes, {
		prefix: "/companies/:subdomain/makers",
	});
	await app.register(modelsRoutes, {
		prefix: "/companies/:subdomain/models",
	});
	await app.register(uploadsRoutes, { prefix: "/uploads" });

	app.get("/", { schema: { hide: true } }, (_, reply) => {
		reply
			.status(200)
			.send("Hello from Fixr API! Reach the documentation at /docs");
	});

	if (docs) {
		// OpenAPI spec consumed by Scalar (and external tools).
		app.get("/openapi.json", { schema: { hide: true } }, async () =>
			app.swagger()
		);

		// Scalar UI: register after all routes so the spec is complete.
		await app.register(scalarUi, {
			routePrefix: "/docs",
			configuration: {
				url: "/openapi.json",
				metaData: {
					title: `Docs - ${APP_NAME} API`,
				},
				favicon: "/public/favicon.ico",
				theme: "none",
			},
		});

		// Classic Swagger UI (alternative to Scalar).
		await app.register(fastifySwaggerUi, {
			routePrefix: "/reference",
		});
	}

	await app.register(fastifyCors, {
		origin: [env.FRONTEND_URL, `http://localhost:${env.NODE_PORT}`],
		credentials: true,
	});

	return app;
}
