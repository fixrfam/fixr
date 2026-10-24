import { afterEach, describe, expect, it, vi } from "vitest";
import { hashOpaqueToken } from "../lib/opaque-token";
import {
	authenticatePortal,
	PORTAL_SESSION_COOKIE,
} from "./authenticate-portal";

const repo = vi.hoisted(() => ({ queryActiveSession: vi.fn() }));

vi.mock("../../modules/portal/repositories", () => ({
	PortalRepository: repo,
}));

const request = (cookies: Record<string, string>) =>
	({ cookies }) as unknown as Parameters<typeof authenticatePortal>[0] & {
		portal?: unknown;
	};

afterEach(() => {
	vi.clearAllMocks();
});

describe("authenticatePortal", () => {
	it("refuses a request without the portal cookie", async () => {
		await expect(
			authenticatePortal(request({}), {} as never)
		).rejects.toMatchObject({ code: "portal_unauthorized" });
		expect(repo.queryActiveSession).not.toHaveBeenCalled();
	});

	it("refuses an unknown, expired or revoked session", async () => {
		repo.queryActiveSession.mockResolvedValue(null);

		await expect(
			authenticatePortal(
				request({ [PORTAL_SESSION_COOKIE]: "tok" }),
				{} as never
			)
		).rejects.toMatchObject({ code: "portal_unauthorized" });
	});

	it("looks the session up by the token's hash and sets the identity", async () => {
		repo.queryActiveSession.mockResolvedValue({
			id: "s1",
			cpf: "52998224725",
			email: "maria@fixr.test",
			clientId: "c1",
		});
		const req = request({ [PORTAL_SESSION_COOKIE]: "tok" });

		await authenticatePortal(req, {} as never);

		expect(repo.queryActiveSession).toHaveBeenCalledWith(
			hashOpaqueToken("tok")
		);
		expect(req.portal).toEqual({
			sessionId: "s1",
			cpf: "52998224725",
			email: "maria@fixr.test",
			clientId: "c1",
		});
	});
});
