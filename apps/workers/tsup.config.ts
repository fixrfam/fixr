import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	platform: "node",
	target: "node22",
	outExtension: () => ({ js: ".js" }),
	noExternal: [
		"@fixr/mail",
		"@fixr/constants",
		"@fixr/env",
		"@react-email/render",
		"@react-email/components",
	],
	esbuildOptions: (options) => {
		options.banner = {
			js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
		};
	},
});
