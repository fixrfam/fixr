import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { axios } from "./axios";

let refreshCalls = 0;

function countRefreshes(
	response: () => Response = () => HttpResponse.json(envelope({}))
) {
	refreshCalls = 0;
	server.use(
		http.post(apiUrl("/auth/token"), () => {
			refreshCalls += 1;
			return response();
		})
	);
}

describe("axios client", () => {
	beforeEach(() => {
		countRefreshes();
	});

	it("sends credentials and targets NEXT_PUBLIC_API_URL", async () => {
		setSessionCookie(fakeJwt());
		server.use(
			http.get(apiUrl("/companies"), () =>
				HttpResponse.json(envelope({ id: "c" }))
			)
		);

		const response = await axios.get("/companies");

		expect(axios.defaults.withCredentials).toBe(true);
		expect(response.data.data).toEqual({ id: "c" });
		expect(refreshCalls).toBe(0);
	});

	it("refreshes the session before a request when the JWT cookie is missing", async () => {
		server.use(
			http.get(apiUrl("/companies"), () => HttpResponse.json(envelope(null)))
		);

		await axios.get("/companies");

		expect(refreshCalls).toBe(1);
	});

	it("refreshes the session before a request when the JWT is expired", async () => {
		setSessionCookie(fakeJwt({ exp: Math.floor(Date.now() / 1000) - 10 }));
		server.use(
			http.get(apiUrl("/companies"), () => HttpResponse.json(envelope(null)))
		);

		await axios.get("/companies");

		expect(refreshCalls).toBe(1);
	});

	it("on a 401 refreshes and retries the request once", async () => {
		setSessionCookie(fakeJwt());
		let calls = 0;
		server.use(
			http.get(apiUrl("/companies"), () => {
				calls += 1;
				return calls === 1
					? HttpResponse.json(envelope(null, { status: 401 }), { status: 401 })
					: HttpResponse.json(envelope({ ok: true }));
			})
		);

		const response = await axios.get("/companies");

		expect(response.data.data).toEqual({ ok: true });
		expect(calls).toBe(2);
		expect(refreshCalls).toBe(1);
	});

	it("does not loop when the retried request is still 401", async () => {
		setSessionCookie(fakeJwt());
		let calls = 0;
		server.use(
			http.get(apiUrl("/companies"), () => {
				calls += 1;
				return HttpResponse.json(envelope(null, { status: 401 }), {
					status: 401,
				});
			})
		);

		await expect(axios.get("/companies")).rejects.toMatchObject({
			response: { status: 401 },
		});
		expect(calls).toBe(2);
		expect(refreshCalls).toBe(1);
	});

	it("rejects when the refresh itself fails (network)", async () => {
		setSessionCookie(fakeJwt());
		countRefreshes(() => HttpResponse.error());
		server.use(
			http.get(apiUrl("/companies"), () =>
				HttpResponse.json(envelope(null, { status: 401 }), { status: 401 })
			)
		);

		await expect(axios.get("/companies")).rejects.toBeDefined();
	});

	it("does not try to refresh on 401s from auth endpoints", async () => {
		setSessionCookie(fakeJwt());
		server.use(
			http.post(apiUrl("/auth/login"), () =>
				HttpResponse.json(envelope(null, { status: 401 }), { status: 401 })
			)
		);

		await expect(axios.post("/auth/login", {})).rejects.toMatchObject({
			response: { status: 401 },
		});
		expect(refreshCalls).toBe(0);
	});

	it("concurrent 401s trigger a single refresh and all requests are retried", async () => {
		setSessionCookie(fakeJwt());
		const seen = new Map<string, number>();
		let releaseRefresh: () => void = () => undefined;
		const refreshGate = new Promise<void>((resolve) => {
			releaseRefresh = resolve;
		});
		refreshCalls = 0;
		server.use(
			http.post(apiUrl("/auth/token"), async () => {
				refreshCalls += 1;
				await refreshGate;
				return HttpResponse.json(envelope({}));
			}),
			http.get(apiUrl("/items/:id"), ({ params }) => {
				const id = String(params.id);
				const count = (seen.get(id) ?? 0) + 1;
				seen.set(id, count);
				return count === 1
					? HttpResponse.json(envelope(null, { status: 401 }), { status: 401 })
					: HttpResponse.json(envelope({ id }));
			})
		);

		const requests = ["a", "b", "c"].map((id) => axios.get(`/items/${id}`));
		await new Promise((resolve) => setTimeout(resolve, 50));
		releaseRefresh();
		const responses = await Promise.all(requests);

		expect(responses.map((r) => r.data.data.id)).toEqual(["a", "b", "c"]);
		expect(refreshCalls).toBe(1);
	});
});
