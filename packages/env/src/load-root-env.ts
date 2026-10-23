import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/**
 * Loads the repo root `.env` (local development only). The root is found by
 * walking up to `turbo.json`, so it works from the source files and from a
 * bundled `dist/`. Existing variables are never overridden, and when there is
 * no `.env` (CI, Coolify, Cloudflare, tests) this does nothing.
 */
function findRootEnv() {
	let dir = dirname(fileURLToPath(import.meta.url));

	while (true) {
		if (existsSync(join(dir, "turbo.json"))) {
			return join(dir, ".env");
		}

		const parent = dirname(dir);
		if (parent === dir) {
			return null;
		}
		dir = parent;
	}
}

try {
	const rootEnv = findRootEnv();

	if (rootEnv && existsSync(rootEnv)) {
		config({ path: rootEnv, quiet: true });
	}
} catch {
	// Runtimes without a real filesystem (e.g. Cloudflare Workers) rely on
	// injected env only, same as dotenv silently skipping a missing file.
}
