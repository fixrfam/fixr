/**
 * Playwright `webServer` for the API: brings up the dedicated e2e MySQL/Redis
 * (e2e/docker-compose.yml), creates the schema, then runs apps/server with
 * the Turnstile stub preloaded.
 */
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { withDb } from "../fixtures/db";
import { apiEnv } from "../support/env";

const root = fileURLToPath(new URL("../..", import.meta.url));
const e2eDir = `${root}/e2e`;

function run(
	cmd: string,
	args: string[],
	cwd: string,
	env: Record<string, string> = {}
) {
	execFileSync(cmd, args, {
		cwd,
		stdio: "inherit",
		env: { ...process.env, ...env },
	});
}

run(
	"docker",
	["compose", "-f", "docker-compose.yml", "up", "-d", "--wait"],
	e2eDir
);

// Same approach as the server integration harness (see apps/server/test/global-setup.ts).
run(
	"bunx",
	["--bun", "drizzle-kit", "push", "--force"],
	`${root}/packages/db`,
	apiEnv
);
await withDb(async (db) => {
	const [indexes] = await db.query(
		"SHOW INDEX FROM models WHERE Key_name = 'models_fulltext_idx'"
	);
	if ((indexes as unknown[]).length === 0) {
		await db.query(
			"ALTER TABLE `models` ADD FULLTEXT INDEX `models_fulltext_idx` (`name`, `models_text`, `chipset`, `cpu`, `internal_memory`, `os`)"
		);
	}
});

// Data is reset and seeded by global-setup.ts on every run (also when servers are reused).

const server = spawn(
	`${root}/apps/server/node_modules/.bin/tsx`,
	["--import", `${e2eDir}/support/stub-turnstile.mjs`, "src/server.ts"],
	{
		cwd: `${root}/apps/server`,
		stdio: "inherit",
		env: { ...process.env, ...apiEnv },
	}
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => process.exit(code ?? 0));
