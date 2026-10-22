import { defineConfig } from "vitest/config";

export default defineConfig({
	// The package ships TSX; tests use React's automatic runtime.
	oxc: {
		jsx: { runtime: "automatic" },
	},
	test: {
		include: ["src/**/*.spec.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/*.spec.*", "src/locales/**"],
			reporter: ["text", "json-summary", "lcov"],
			thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
		},
	},
});
