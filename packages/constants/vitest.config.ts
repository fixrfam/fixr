import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.spec.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.*", "src/test-utils.ts"],
			reporter: ["text", "json-summary", "lcov"],

			thresholds: { lines: 80, branches: 90, functions: 90, statements: 80 },
		},
	},
});
