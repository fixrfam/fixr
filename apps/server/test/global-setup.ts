import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
	MySqlContainer,
	type StartedMySqlContainer,
} from "@testcontainers/mysql";
import {
	RedisContainer,
	type StartedRedisContainer,
} from "@testcontainers/redis";
import mysql from "mysql2/promise";
import type { TestProject } from "vitest/node";

const DB_PACKAGE_DIR = fileURLToPath(
	new URL("../../../packages/db", import.meta.url)
);

/** Runs `drizzle-kit push` (the `db:push` script) from `packages/db` against the test database. */
function pushSchema(dbUrl: string) {
	execFileSync("bunx", ["--bun", "drizzle-kit", "push", "--force"], {
		cwd: DB_PACKAGE_DIR,
		stdio: "pipe",
		env: {
			...process.env,
			DB_URL: dbUrl,
			MYSQL_ROOT_PASSWORD: "test",
			MYSQL_DATABASE: "fixr_test",
			MYSQL_USER: "test",
			MYSQL_PASSWORD: "test",
			REDIS_PASSWORD: "test",
		},
	});
}

declare module "vitest" {
	export interface ProvidedContext {
		DB_URL: string;
		REDIS_URL: string;
	}
}

let mysqlContainer: StartedMySqlContainer | undefined;
let redisContainer: StartedRedisContainer | undefined;

/**
 * Starts real MySQL + Redis containers once for the whole integration run and
 * creates the schema from the Drizzle source (`@fixr/db/schema`).
 *
 * The schema is pushed instead of replaying `packages/db/drizzle/*.sql`
 * because that migration chain does not apply to an empty database today
 * (`0012` renames `uploads.purpose`, which no earlier migration creates).
 * Once the chain is repaired, switch this back to `migrate()`.
 *
 * `@fixr/db/connection` builds its pool from `env.DB_URL` at import time, so
 * the URLs must exist before any test file is imported. They are handed to
 * the workers through `provide()` and written to `process.env` by
 * `setup-integration.ts`.
 */
export async function setup(project: TestProject) {
	[mysqlContainer, redisContainer] = await Promise.all([
		new MySqlContainer("mysql:8.0")
			.withDatabase("fixr_test")
			.withUsername("test")
			.withUserPassword("test")
			.withRootPassword("test")
			.start(),
		new RedisContainer("redis:7-alpine").start(),
	]);

	const dbUrl = `mysql://test:test@${mysqlContainer.getHost()}:${mysqlContainer.getPort()}/fixr_test`;
	const redisUrl = redisContainer.getConnectionUrl();

	pushSchema(dbUrl);

	const connection = await mysql.createConnection({
		uri: dbUrl,
	});
	try {
		// `ModelsRepository.buildListFilter` uses MATCH ... AGAINST, which needs this
		// FULLTEXT index (created by migration 0010, not declared in the schema source).
		await connection.query(
			"ALTER TABLE `models` ADD FULLTEXT INDEX `models_fulltext_idx` (`name`, `models_text`, `chipset`, `cpu`, `internal_memory`, `os`)"
		);
	} finally {
		await connection.end();
	}

	project.provide("DB_URL", dbUrl);
	project.provide("REDIS_URL", redisUrl);
}

export async function teardown() {
	await Promise.all([mysqlContainer?.stop(), redisContainer?.stop()]);
}
