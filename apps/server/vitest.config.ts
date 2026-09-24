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
			// Start low (the codebase started at zero) and ratchet up; never lower them to merge.
			thresholds: {
				lines: 60,
				branches: 65,
				functions: 65,
				statements: 60,
				// Security-critical: authentication and RBAC middlewares.
				"src/core/middlewares/**": {
					lines: 90,
					branches: 80,
					functions: 100,
					statements: 90,
				},
			},
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
