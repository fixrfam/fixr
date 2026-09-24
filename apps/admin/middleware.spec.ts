import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Run the real route matcher, but capture the handler clerkMiddleware wraps.
vi.mock("@clerk/nextjs/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@clerk/nextjs/server")>();
	return {
		...actual,
		clerkMiddleware: (handler: unknown) => handler,
	};
});

const { default: middleware, config } = await import("./middleware");

const protect = vi.fn();
const run = (path: string) =>
	(middleware as unknown as (auth: unknown, req: NextRequest) => Promise<void>)(
		{ protect },
		new NextRequest(`http://admin.test${path}`)
	);

describe("admin middleware (Clerk)", () => {
	beforeEach(() => {
		protect.mockReset();
	});

	it.each([
		"/dash",
		"/dash/companies",
		"/dash/companies/new",
		"/api/anything",
	])("requires a Clerk session on %s (signed-out users are redirected by auth.protect)", async (path) => {
		await run(path);

		expect(protect).toHaveBeenCalledTimes(1);
	});

	it("fails closed for paths that merely start with /dash", async () => {
		await run("/dashboard-lookalike");

		expect(protect).toHaveBeenCalled();
	});

	it.each(["/", "/sign-in"])("leaves %s public", async (path) => {
		await run(path);

		expect(protect).not.toHaveBeenCalled();
	});

	it("propagates the redirect/401 thrown by auth.protect for signed-out users", async () => {
		protect.mockRejectedValue(new Error("NEXT_REDIRECT"));

		await expect(run("/dash")).rejects.toThrow("NEXT_REDIRECT");
	});

	it("runs on pages and API routes but skips static assets", () => {
		const [pages, api] = config.matcher.map(
			(pattern) => new RegExp(`^${pattern}$`)
		);

		expect(pages?.test("/dash/companies")).toBe(true);
		expect(pages?.test("/_next/static/chunk.js")).toBe(false);
		expect(pages?.test("/logo.png")).toBe(false);
		expect(api?.test("/api/companies")).toBe(true);
	});
});
