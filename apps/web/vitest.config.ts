import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	// Next.js compiles JSX itself (tsconfig "jsx": "preserve"); tests use React's automatic runtime.
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
		exclude: [
			"node_modules/**",
			".next/**",
			"components/ui/**",
			"components/magicui/**",
		],
		setupFiles: ["./test/setup.ts"],
		env: {
			NEXT_PUBLIC_API_URL: "http://api.test",
			NEXT_PUBLIC_APP_URL: "http://app.test",
			NEXT_PUBLIC_DOCS_URL: "http://docs.test",
			NEXT_PUBLIC_LINKTREE_URL: "http://links.test",
			NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
		},
		coverage: {
			provider: "v8",
			include: ["lib/**", "components/**", "app/**"],
			exclude: ["components/ui/**", "components/magicui/**", "**/*.spec.*"],
			reporter: ["text", "json-summary", "lcov"],
		},
	},
});
