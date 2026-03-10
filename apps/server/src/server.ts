import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import { Elysia } from "elysia";
import { ZodError } from "zod";
import { apiResponse } from "./helpers/response";
import { accountRoutes } from "./routes/account.routes";
import { authRoutes } from "./routes/auth.routes";
import { companiesRoutes } from "./routes/companies/companies.routes";
import { employeesRoutes } from "./routes/companies/employees/employees.routes";
import { credentialsRoutes } from "./routes/credentials.routes";

const isCloudflare = env.WORKER_ENV === "production";

const createApp = () =>
	new Elysia({ adapter: isCloudflare ? undefined : node() })
		.use(
			cors({
				origin: [env.FRONTEND_URL, `http://localhost:${env.NODE_PORT ?? 8787}`],
				credentials: true,
			})
		)
		.use(
			cookie({
				secret: env.COOKIE_ENCRYPTION_SECRET,
			})
		)
		.use(authRoutes)
		.use(accountRoutes)
		.use(credentialsRoutes)
		.use(companiesRoutes)
		.use(employeesRoutes)
		.get(
			"/",
			() =>
				`Hello from Elysia ${APP_NAME} API! Visit our documentation at /docs`
		)
		.onError(({ error, set }) => {
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

			console.error("Unhandled error:", error);
			set.status = 500;
			return apiResponse({
				status: 500,
				error: "Internal Server Error",
				code: "internal_error",
				message: "Something went wrong.",
				data: null,
			});
		});

let app = createApp();

if (isCloudflare) {
	app = app.compile();
}

const port = Number(env.NODE_PORT) || 3333;
app.listen(port);

console.log(`Server running at http://localhost:${port}`);

export default app;
