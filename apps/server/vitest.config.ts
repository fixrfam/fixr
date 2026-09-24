import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testEnv } from "./test/env";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@/": root,
		},
	},
	test: {
		env: testEnv,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.ts", "src/server.ts", "src/core/docs/**"],
			reporter: ["text", "json-summary", "lcov"],
		},
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.spec.ts"],
					setupFiles: ["./test/setup-unit.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "integration",
					include: ["test/integration/**/*.spec.ts"],
					globalSetup: ["./test/global-setup.ts"],
					setupFiles: ["./test/setup-integration.ts"],
					// Every file shares the same MySQL/Redis containers and truncates them between tests.
					fileParallelism: false,
					testTimeout: 30_000,
					hookTimeout: 180_000,
				},
			},
		],
	},
});
