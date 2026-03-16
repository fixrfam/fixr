import path from "node:path";
import { env } from "@fixr/env/db";
import chalk from "chalk";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const dbUrl = env.DB_URL.replace("postgres:5432", "localhost:5432");

(async () => {
	console.log("Connecting to database:", dbUrl);

	const url = new URL(dbUrl);

	const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";

	const connection = await mysql.createConnection({
		host: url.hostname,
		port: Number(url.port) || 4000,
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.slice(1),
		ssl: isLocal
			? undefined
			: { minVersion: "TLSv1.2", rejectUnauthorized: false },
		multipleStatements: true,
	});

	const db = drizzle(connection, { logger: true });

	console.log("Migrations folder:", path.resolve("drizzle"));

	try {
		await migrate(db, { migrationsFolder: "drizzle" });
		console.log(chalk.greenBright("Migrations applied successfully!"));
	} catch (error) {
		console.error(chalk.redBright("Migration failed:"), error);
		throw new Error(`Migration process failed. ${error}`); // Throw an error to stop CI
	} finally {
		await connection.end();
	}

	process.exit();
})();
