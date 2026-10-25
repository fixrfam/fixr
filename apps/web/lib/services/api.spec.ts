import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { apiUrl } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { getApiHealthStatus } from "./api";

describe("getApiHealthStatus", () => {
	beforeEach(() => {
		setSessionCookie(fakeJwt());
	});

	it("is true when the API answers its greeting", async () => {
		expect(await getApiHealthStatus()).toBe(true);
	});

	it("is false on a 5xx", async () => {
		server.use(
			http.get(apiUrl("/"), () => new HttpResponse("down", { status: 503 }))
		);

		expect(await getApiHealthStatus()).toBe(false);
	});

	it("is false on a 4xx", async () => {
		server.use(
			http.get(apiUrl("/"), () => new HttpResponse(null, { status: 404 }))
		);

		expect(await getApiHealthStatus()).toBe(false);
	});

	it("is false on a network error", async () => {
		server.use(http.get(apiUrl("/"), () => HttpResponse.error()));

		expect(await getApiHealthStatus()).toBe(false);
	});

	it("is false when something else answers with 200", async () => {
		server.use(
			http.get(apiUrl("/"), () => HttpResponse.text("nginx welcome page"))
		);

		expect(await getApiHealthStatus()).toBe(false);
	});
});
