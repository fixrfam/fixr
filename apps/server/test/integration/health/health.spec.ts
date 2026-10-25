import { describe, expect, it } from "vitest";
import { createTestApp } from "../../helpers/app";

describe("GET /health", () => {
	it("reports MySQL, Redis and the email queue as healthy", async () => {
		const app = await createTestApp();

		const response = await app.inject({ method: "GET", url: "/health" });

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.status).toBe("ok");
		expect(body.services.mysql.status).toBe("ok");
		expect(body.services.redis.status).toBe("ok");
		expect(body.services.workers.status).toBe("ok");
	});
});
