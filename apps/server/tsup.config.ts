import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server.ts"],
	format: "esm",
	outExtension: () => ({ js: ".js" }),
	noExternal: [
		"@fixr/constants",
		"@fixr/db",
		"@fixr/mail",
		"@fixr/permissions",
		"@fixr/schemas",
		"@fixr/env",
	],
});
