/**
 * One-command local bootstrap: `bun run setup [--reset] [--no-seed]`.
 *
 * 1. Creates the root `.env` from `.env.example` (merging any legacy per-folder
 *    `.env` files and generating the auth secrets). An existing `.env` is kept.
 * 2. Starts MySQL + Redis with Docker and waits until they are healthy.
 * 3. Creates/updates the schema.
 * 4. Seeds demo data (`packages/db/src/seed`).
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));

const LEGACY_ENV_FILES = [
	"packages/db/.env",
	"packages/mail/.env",
	"apps/server/.env",
	"apps/workers/.env",
	"apps/web/.env",
	"apps/admin/.env",
];

const GENERATED_SECRETS = [
	"JWT_SECRET",
	"API_KEY_SECRET",
	"COOKIE_ENCRYPTION_SECRET",
];

const FULLTEXT_INDEX_SQL =
	"ALTER TABLE `models` ADD FULLTEXT INDEX `models_fulltext_idx` (`name`, `models_text`, `chipset`, `cpu`, `internal_memory`, `os`)";

const step = (message: string) =>
	console.log(`\n\x1b[1;36m> ${message}\x1b[0m`);

function run(cmd: string[], cwd = root, options: { quiet?: boolean } = {}) {
	const [bin, ...rest] = cmd;
	const result = spawnSync(bin, rest, {
		cwd,
		encoding: "utf8",
		stdio: options.quiet ? "pipe" : "inherit",
	});
	if (result.status !== 0) {
		if (options.quiet) {
			process.stderr.write(result.stderr ?? "");
		}
		console.error(`\n\x1b[31mFailed: ${cmd.join(" ")}\x1b[0m`);
		process.exit(result.status ?? 1);
	}
	return result.stdout ?? "";
}

const quote = (value: string) =>
	value.includes("'") ? `"${value.replaceAll('"', '\\"')}"` : `'${value}'`;

/** Rewrites `KEY=...` lines of the example with the given values. */
function fillTemplate(template: string, values: Record<string, string>) {
	return template.replace(/^([A-Z0-9_]+)=.*$/gm, (line, key: string) =>
		key in values ? `${key}=${quote(values[key])}` : line
	);
}

function createEnvFile() {
	const envPath = join(root, ".env");
	if (existsSync(envPath)) {
		console.log(".env already exists, keeping it.");
		return;
	}

	const template = readFileSync(join(root, ".env.example"), "utf8");
	const values: Record<string, string> = {};

	const legacy = LEGACY_ENV_FILES.filter((file) =>
		existsSync(join(root, file))
	);
	for (const file of legacy) {
		for (const [key, value] of Object.entries(
			parse(readFileSync(join(root, file)))
		)) {
			if (value !== "") {
				values[key] = value;
			}
		}
	}

	const defaults = parse(template);
	for (const key of GENERATED_SECRETS) {
		if (!(values[key] || defaults[key])) {
			values[key] = randomBytes(36).toString("base64url");
		}
	}

	writeFileSync(envPath, fillTemplate(template, values));
	console.log("Created .env from .env.example with generated secrets.");
	if (legacy.length > 0) {
		console.log(
			`Merged values from ${legacy.join(", ")}.\nThose files are no longer read, you can delete them.`
		);
	}
}

function mysql(env: Record<string, string>, query: string) {
	return run(
		[
			"docker",
			"compose",
			"exec",
			"-T",
			"mysql",
			"mysql",
			"-N",
			`-u${env.MYSQL_USER}`,
			`-p${env.MYSQL_PASSWORD}`,
			env.MYSQL_DATABASE,
			"-e",
			query,
		],
		root,
		{ quiet: true }
	).trim();
}

/**
 * A database created by migrations keeps using them. A new one is created with
 * `drizzle-kit push` because the migration chain does not apply to an empty
 * database yet (see apps/server/test/global-setup.ts), same as the test suites.
 */
function syncSchema() {
	const env = parse(readFileSync(join(root, ".env")));
	const dbDir = join(root, "packages/db");

	const hasMigrations =
		mysql(env, "SHOW TABLES LIKE '__drizzle_migrations'") !== "";

	if (hasMigrations) {
		run(["bun", "run", "db:migrate"], dbDir);
		return;
	}

	run(["bunx", "--bun", "drizzle-kit", "push", "--force"], dbDir);

	const hasIndex =
		mysql(
			env,
			"SHOW INDEX FROM models WHERE Key_name = 'models_fulltext_idx'"
		) !== "";
	if (!hasIndex) {
		mysql(env, FULLTEXT_INDEX_SQL);
	}
}

step("Environment");
createEnvFile();

step("Starting MySQL and Redis");
run(["docker", "compose", "up", "-d", "--wait"]);

step("Database schema");
syncSchema();

if (args.has("--no-seed")) {
	console.log("\nSkipping seed (--no-seed).");
} else {
	step("Seeding demo data");
	run(
		["bun", "run", "db:seed", ...(args.has("--reset") ? ["--reset"] : [])],
		join(root, "packages/db")
	);
}

console.log(`\x1b[1;32mReady.\x1b[0m Start the apps with \x1b[1mbun run dev\x1b[0m:
  web    http://localhost:3000
  api    http://localhost:3333 (docs at /reference)
  admin  http://localhost:6969 (bun run dev:admin, needs Clerk keys)
`);
