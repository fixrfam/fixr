import { describe, expect, it } from "vitest";
import { buildApp } from "./app";

describe("buildApp", () => {
	it("builds the app without listening on a port", async () => {
		const app = await buildApp({ logger: false, docs: false });

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(200);
		expect(app.server.listening).toBe(false);
		await app.close();
	});

	it("registers the docs routes only when docs are enabled", async () => {
		const withDocs = await buildApp({ logger: false });
		const withoutDocs = await buildApp({ logger: false, docs: false });

		const [enabled, disabled] = await Promise.all([
			withDocs.inject({ method: "GET", url: "/openapi.json" }),
			withoutDocs.inject({ method: "GET", url: "/openapi.json" }),
		]);

		expect(enabled.statusCode).toBe(200);
		expect(disabled.statusCode).toBe(404);
		await Promise.all([withDocs.close(), withoutDocs.close()]);
	});
});
