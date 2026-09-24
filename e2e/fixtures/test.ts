import { test as base } from "@playwright/test";
import { stubTurnstile } from "../support/turnstile";

export { waitForTurnstile } from "../support/turnstile";

import type { SeededRole } from "./data";

export const authFile = (role: SeededRole | "beta-admin") =>
	`.auth/${role}.json`;

/**
 * Every test gets the Turnstile stub and disabled animations.
 * Use `test.use({ storageState: authFile("manager") })` to start logged in.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await stubTurnstile(page);
		await page.addInitScript(() => {
			const style = document.createElement("style");
			style.textContent =
				"*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }";
			document.addEventListener("DOMContentLoaded", () =>
				document.head.appendChild(style)
			);
		});
		await use(page);
	},
});

export { expect } from "@playwright/test";
