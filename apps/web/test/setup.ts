import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// jsdom lacks a few DOM APIs Radix primitives (Select, Dialog) rely on.
if (!Element.prototype.hasPointerCapture) {
	Element.prototype.hasPointerCapture = () => false;
	Element.prototype.releasePointerCapture = () => undefined;
}
if (!Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = () => undefined;
}
if (!globalThis.ResizeObserver) {
	globalThis.ResizeObserver = class {
		observe() {
			// noop
		}
		unobserve() {
			// noop
		}
		disconnect() {
			// noop
		}
	};
}

// Unhandled requests fail the test: every HTTP call must be declared in a handler.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
	server.resetHandlers();
	cleanup();
	for (const cookie of document.cookie.split(";")) {
		const name = cookie.split("=")[0]?.trim();
		if (name) {
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
		}
	}
});
afterAll(() => server.close());
