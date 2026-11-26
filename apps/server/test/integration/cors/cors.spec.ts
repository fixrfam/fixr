import { describe, expect, it } from "vitest";
import { testEnv } from "../../env";
import { createTestApp } from "../../helpers/app";

/** A browser's preflight before a credentialed POST from `origin`. */
async function preflight(origin: string) {
	const app = await createTestApp();
	return app.inject({
		method: "OPTIONS",
		url: "/companies",
		headers: {
			origin,
			"access-control-request-method": "POST",
			"access-control-request-headers": "content-type",
		},
	});
}

describe("CORS", () => {
	it.each([
		["the web app", testEnv.FRONTEND_URL],
		["the admin panel", testEnv.ADMIN_URL],
	])("lets %s call the API with credentials", async (_, origin) => {
		const response = await preflight(origin);

		expect(response.headers["access-control-allow-origin"]).toBe(origin);
		expect(response.headers["access-control-allow-credentials"]).toBe("true");
	});

	it("doesn't allow other origins", async () => {
		const response = await preflight("https://evil.example");

		expect(response.headers["access-control-allow-origin"]).toBeUndefined();
	});
});
