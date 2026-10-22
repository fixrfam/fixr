import { defineConfig, devices } from "@playwright/test";
import { API_URL, WEB_PORT, WEB_URL, webEnv } from "./support/env";

const isCI = Boolean(process.env.CI);

export default defineConfig({
	testDir: "./tests",
	testMatch: "**/*.e2e.ts",
	globalSetup: "./global-setup.ts",
	// Tests share one seeded database; run them serially for determinism.
	workers: 1,
	fullyParallel: false,
	forbidOnly: isCI,
	retries: 0,
	timeout: 60_000,
	expect: { timeout: 10_000 },
	reporter: isCI
		? [["github"], ["html", { open: "never" }]]
		: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: WEB_URL,
		viewport: { width: 1280, height: 800 },
		locale: "pt-BR",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
			? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
			: undefined,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 800 },
			},
		},
	],
	webServer: [
		{
			// Starts the dedicated MySQL/Redis, seeds, and runs apps/server (see scripts/start-api.ts).
			command: "bun scripts/start-api.ts",
			url: `${API_URL}/health`,
			reuseExistingServer: !isCI,
			timeout: 240_000,
			stdout: "pipe",
		},
		{
			command: `bunx next dev --turbopack -p ${WEB_PORT}`,
			cwd: "../apps/web",
			url: `${WEB_URL}/auth/login`,
			reuseExistingServer: !isCI,
			timeout: 240_000,
			env: { ...webEnv, NEXT_TELEMETRY_DISABLED: "1" },
		},
	],
});
