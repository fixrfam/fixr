import { cookieKey } from "@fixr/constants/cookies";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { fakeJwt } from "@/test/jwt";
import { middleware } from "./middleware";

const APP = "http://app.test";

function request(path: string, role?: string, subdomain = "fixr") {
	const req = new NextRequest(`${APP}${path}`);
	if (role) {
		req.cookies.set(
			cookieKey("session"),
			fakeJwt({ company: { id: "c", name: "Fixr", subdomain, role } })
		);
	}
	return req;
}

const location = async (req: NextRequest) =>
	(await middleware(req)).headers.get("location");

describe("web middleware", () => {
	it("lets a role through when it has the route permission", async () => {
		expect(
			await location(request("/dashboard/fixr/employees", "manager"))
		).toBeNull();
	});

	it("redirects to home when the role lacks the route permission", async () => {
		expect(
			await location(request("/dashboard/fixr/employees", "technician"))
		).toBe(`${APP}/dashboard/fixr/home`);
	});

	it("uses the exact rule for /new pages (technician can't create orders)", async () => {
		expect(
			await location(
				request("/dashboard/fixr/service-orders/new", "technician")
			)
		).toBe(`${APP}/dashboard/fixr/home`);
		expect(
			await location(request("/dashboard/fixr/service-orders", "technician"))
		).toBeNull();
	});

	it("does not loop when the role can't see home either (guest)", async () => {
		expect(await location(request("/dashboard/fixr/home", "guest"))).toBe(
			`${APP}/dashboard/fixr/support`
		);
		expect(
			await location(request("/dashboard/fixr/support", "guest"))
		).toBeNull();
	});

	it("keeps users inside their own tenant", async () => {
		expect(await location(request("/dashboard/other/employees", "admin"))).toBe(
			`${APP}/dashboard/fixr/employees`
		);
		expect(await location(request("/dashboard/other", "admin"))).toBe(
			`${APP}/dashboard/fixr`
		);
	});
});
