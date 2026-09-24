import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@/": root,
		},
	},
	test: {
		include: ["src/**/*.spec.ts"],
		env: {
			NODE_ENV: "test",
			REDIS_URL: "redis://default:test@127.0.0.1:6379/0",
			RESEND_KEY: "re_test",
		},
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.ts", "src/index.ts"],
			reporter: ["text", "json-summary", "lcov"],
			thresholds: { lines: 80, branches: 70, functions: 80, statements: 80 },
		},
	},
});
