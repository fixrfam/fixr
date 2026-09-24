import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	oxc: {
		jsx: { runtime: "automatic" },
	},
	resolve: {
		alias: {
			"@/": root,
		},
	},
	test: {
		environment: "jsdom",
		include: ["**/*.spec.{ts,tsx}"],
		exclude: ["node_modules/**", ".next/**", "components/ui/**"],
		setupFiles: ["./test/setup.ts"],
		env: {
			NEXT_PUBLIC_API_URL: "http://api.test",
			NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsudGVzdCQ",
			CLERK_SECRET_KEY: "sk_test_clerk",
		},
		coverage: {
			provider: "v8",
			include: ["lib/**", "components/**", "app/**", "middleware.ts"],
			exclude: ["components/ui/**", "**/*.spec.*"],
			reporter: ["text", "json-summary", "lcov"],
		},
	},
});
