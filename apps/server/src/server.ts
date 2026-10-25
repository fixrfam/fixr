import { env } from "@fixr/env/server";
import chalk from "chalk";
import { buildApp } from "./app";

buildApp()
	.then(async (server) => {
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
