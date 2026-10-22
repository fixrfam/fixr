import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: {
		/**
		 * Declared inline because vite resolves each file's tsconfig through node,
		 * and `@fixr/typescript-config` is not linked inside every workspace
		 * package, so transforming an import from one of them fails on the
		 * unresolved `extends`. These are the options from
		 * `@fixr/typescript-config/api.json` that affect the transform.
		 */
		tsconfigRaw: {
			compilerOptions: {
				target: "es2020",
				experimentalDecorators: true,
				useDefineForClassFields: false,
			},
		},
	},
});
