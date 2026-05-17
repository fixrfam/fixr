import { join } from "node:path";
import { cwd } from "node:process";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import chalk from "chalk";
import { Elysia } from "elysia";
import { ZodError } from "zod";
import { apiDescription } from "./core/docs/main";
import { AppError } from "./core/lib/app-error";
import { apiResponse } from "./core/lib/response";
import { accountRoutes } from "./modules/account/routes";
import { authRoutes } from "./modules/auth/routes";
import { companiesRoutes } from "./modules/companies/routes";
import { credentialsRoutes } from "./modules/credentials/routes";
import { employeesRoutes } from "./modules/employees/routes";

const app = new Elysia()
	// Swagger / OpenAPI docs
	.use(
		swagger({
			path: "/docs",
			scalarConfig: {
				spec: {
					url: "/docs/json",
				},
			},
			documentation: {
				info: {
					title: `${APP_NAME} API`,
					version: "1.0.0",
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
						name: "Companies/Employees",
						description: "Manage company employees.",
					},
				],
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
		})
	)
	// JWT
	.use(
		jwt({
			secret: env.JWT_SECRET,
			name: "jwt",
		})
	)
	// Static files
	.use(
		staticPlugin({
			assets: join(cwd(), "public"),
			prefix: "/public/",
		})
	)
	// CORS
	.use(
		cors({
			origin: [env.FRONTEND_URL, `http://localhost:${env.NODE_PORT}`],
			credentials: true,
		})
	)
	// Routes
	.use(authRoutes)
	.use(accountRoutes)
	.use(credentialsRoutes)
	.use(companiesRoutes)
	.use(employeesRoutes)
	// Health check
	.get("/", () => "Hello from Fixr API! Reach the documentation at /docs")
	// Global error handler
	.onError(({ error, set }) => {
		if (error instanceof AppError) {
			set.status = error.status;
			return apiResponse({
				status: error.status,
				error: null,
				code: error.code,
				message: error.message,
				data: error.details ?? null,
			});
		}

		if (error instanceof ZodError) {
			set.status = 400;
			return apiResponse({
				status: 400,
				error: "Bad Request",
				code: "bad_request",
				message: "Type validation failed",
				data: error.issues,
			});
		}

		console.error("Unexpected error:", error);
		set.status = 500;
		return apiResponse({
			status: 500,
			error: "Internal Server Error",
			code: "internal_error",
			message: "Something went wrong.",
			data: null,
		});
	});

const start = async () => {
	try {
		await app.listen({
			port: Number(env.NODE_PORT),
		});
		console.log(
			chalk.greenBright(`✔ Server running at http://localhost:${env.NODE_PORT}`)
		);
	} catch (err) {
		console.error(
			chalk.redBright(`✘ Failed to start server: ${(err as Error).message}`)
		);
		process.exit(1);
	}
};

start();

export type App = typeof app;
