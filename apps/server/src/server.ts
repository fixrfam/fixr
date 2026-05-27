import { join } from "node:path";
import { cwd } from "node:process";
import { fastifyCookie } from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { fastifyJwt } from "@fastify/jwt";
import { fastifyStatic } from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { APP_NAME } from "@fixr/constants/app";
import { companySelectSchema } from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import { accountSchema } from "@fixr/schemas/account";
import { apiResponseSchema } from "@fixr/schemas/utils";
import scalarUi from "@scalar/fastify-api-reference";
import chalk from "chalk";
import { fastify } from "fastify";
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
import { cookieKey } from "./../../../packages/constants/src/cookies";
import { apiDescription } from "./core/docs/main";
import { AppError } from "./core/lib/app-error";
import { apiResponse } from "./core/lib/response";
import { accountRoutes } from "./modules/account/routes";
import { authRoutes } from "./modules/auth/routes";
import { companiesRoutes } from "./modules/companies/routes";
import { credentialsRoutes } from "./modules/credentials/routes";
import { employeesRoutes } from "./modules/employees/routes";
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

z.globalRegistry.add(apiResponseSchema, { id: "Response" });
z.globalRegistry.add(accountSchema, { id: "User" });
z.globalRegistry.add(companySelectSchema, { id: "Company" });

//Set Zod as the default request/response data serializer
const server = fastify({
	logger: envToLogger.development,
	allowErrorHandlerOverride: true,
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

//Map the zod errors to standard response
server.setErrorHandler((error, _request, reply) => {
	if (error instanceof ZodError) {
		reply.status(400).send(
			apiResponse({
				status: 400,
				error: "Bad Request",
				code: "bad_request",
				message: "Type validation failed",
				data: error.issues,
			})
		);
		return;
	}

	reply.send(error);
});

server.setErrorHandler((error, request, response) => {
	if (error instanceof AppError) {
		return error.send(response);
	}
	if (hasZodFastifySchemaValidationErrors(error)) {
		return response.code(400).send(
			apiResponse({
				status: 400,
				error: "Bad Request",
				code: "request_validation_error",
				message: "Request doesn't match the schema",
				data: {
					issues: error.validation,
					method: request.method,
					url: request.url,
				},
			})
		);
	}

	if (isResponseSerializationError(error)) {
		return response.code(500).send(
			apiResponse({
				status: 500,
				error: "Internal Server Error",
				code: "response_serialization_failed",
				message: "Response doesn't match the schema",
				data: error,
			})
		);
	}
});

async function registerPlugins() {
	// @fastify/swagger must be registered before routes (route discovery).
	await server.register(fastifySwagger, {
		openapi: {
			info: {
				title: `${APP_NAME} API`,
				version: "1.0.0",
				summary: `${APP_NAME} API`,
				description: apiDescription,
			},
			tags: [
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
					description:
						"Change account credentials (password) in different ways.",
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
			],
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

	await server.register(fastifyJwt, {
		secret: env.JWT_SECRET,
		cookie: {
			cookieName: cookieKey("session"),
			signed: false,
		},
	});

	await server.register(fastifyCookie, {
		secret: env.COOKIE_ENCRYPTION_SECRET,
	});

	await server.register(fastifyStatic, {
		root: join(cwd(), "public"),
		prefix: "/public/",
	});

	await server.register(authRoutes, {
		prefix: "/auth",
	});

	await server.register(accountRoutes, {
		prefix: "/account",
	});

	await server.register(credentialsRoutes, {
		prefix: "/credentials",
	});

	await server.register(companiesRoutes, {
		prefix: "/companies",
	});

	await server.register(employeesRoutes, {
		prefix: "/companies/:subdomain/employees",
	});

	await server.register(serviceOrdersRoutes, {
		prefix: "/companies/:subdomain/service-orders",
	});

	await server.register(uploadsRoutes, {
		prefix: "/uploads",
	});

	server.get("/", (_, reply) => {
		reply
			.status(200)
			.send("Hello from Fixr API! Reach the documentation at /docs");
	});

	// OpenAPI spec consumed by Scalar (and external tools).
	server.get("/openapi.json", { schema: { hide: true } }, async () =>
		server.swagger()
	);

	// Scalar UI — register after all routes so the spec is complete.
	await server.register(scalarUi, {
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
	await server.register(fastifySwaggerUi, {
		routePrefix: "/reference",
	});

	await server.register(fastifyCors, {
		origin: [env.FRONTEND_URL, `http://localhost:${env.NODE_PORT}`],
		credentials: true,
	});
}

registerPlugins()
	.then(async () => {
		await server.listen({
			port: Number(env.NODE_PORT),
			host: "0.0.0.0",
		});

		console.log(
			chalk.greenBright(`✔ Server running at http://localhost:${env.NODE_PORT}`)
		);
		console.log(
			chalk.greenBright(
				`✔ API docs (Scalar): http://localhost:${env.NODE_PORT}/docs`
			)
		);
		console.log(
			chalk.greenBright(
				`✔ API docs (Swagger): http://localhost:${env.NODE_PORT}/reference`
			)
		);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export default server;
