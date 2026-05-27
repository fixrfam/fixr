import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	outExtension: () => ({ js: ".js" }),
	noExternal: ["@fixr/mail", "@fixr/constants", "@fixr/env"],
});
