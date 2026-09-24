import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.spec.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: ["src/abilities.ts", "src/accessor.ts", "src/permissions.ts"],
			exclude: ["src/**/*.spec.*", "src/test-utils.ts"],
			reporter: ["text", "json-summary", "lcov"],
			// Security-critical: the RBAC matrix must stay fully covered. (react.tsx is covered by apps/web.)
			thresholds: {
				lines: 100,
				branches: 100,
				functions: 100,
				statements: 100,
			},
		},
	},
});
