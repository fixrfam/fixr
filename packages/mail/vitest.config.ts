import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["**/*.spec.{ts,tsx}"],
		exclude: ["node_modules/**", "dist/**"],
		env: { RESEND_KEY: "re_test" },
		coverage: {
			provider: "v8",
			include: ["emails/**", "services/**"],
			reporter: ["text", "json-summary", "lcov"],
		},
	},
});
