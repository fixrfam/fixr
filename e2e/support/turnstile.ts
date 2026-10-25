import type { Page } from "@playwright/test";

/**
 * Serve a fake Turnstile widget instead of challenges.cloudflare.com: it
 * immediately hands the page a token, like Cloudflare's always-pass test key
 * but without depending on the network. The API side is stubbed in
 * support/stub-turnstile.mjs.
 */
const FAKE_TURNSTILE = `
(() => {
	const token = "e2e-turnstile-token";
	window.turnstile = {
		render(_el, options) {
			// The widget is rendered from a client effect, i.e. after hydration: tests
			// wait for this marker before typing, so React never drops their input.
			document.documentElement.dataset.turnstileReady = "true";
			setTimeout(() => options && options.callback && options.callback(token), 0);
			return "e2e-widget";
		},
		reset() {},
		remove() {},
		execute() {},
		getResponse() { return token; },
		isExpired() { return false; },
		ready(cb) { cb(); },
	};
	const src = document.currentScript && document.currentScript.src;
	const onload = src && new URL(src).searchParams.get("onload");
	if (onload && typeof window[onload] === "function") window[onload]();
})();
`;

export async function stubTurnstile(page: Page) {
	await page.route("https://challenges.cloudflare.com/**", (route) =>
		route.fulfill({
			contentType: "application/javascript",
			body: FAKE_TURNSTILE,
		})
	);
}

/** Wait until a Turnstile-protected form is hydrated and has its widget rendered. */
export async function waitForTurnstile(page: Page) {
	await page
		.locator("html[data-turnstile-ready='true']")
		.waitFor({ state: "attached" });
}
