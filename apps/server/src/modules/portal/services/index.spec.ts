import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";
import { hashOpaqueToken } from "../../../core/lib/opaque-token";
import { PORTAL_SESSION_COOKIE } from "../../../core/middlewares/authenticate-portal";

const { repo, estimatesRepo, estimatesService, queueEmail } = vi.hoisted(() => ({
	estimatesService: { recordAnswer: vi.fn() },
	repo: {
		insertLink: vi.fn(),
		revokeShopLinks: vi.fn(),
		queryActiveLink: vi.fn(),
		touchLink: vi.fn(),
		insertSession: vi.fn(),
		queryClientsByEmail: vi.fn(),
		queryClient: vi.fn(),
		queryScopeClients: vi.fn(),
		queryEstimate: vi.fn(),
	},
	estimatesRepo: {
		queryByTokenHash: vi.fn(),
		queryItemsByEstimateIds: vi.fn(),
	},
	queueEmail: vi.fn(),
}));

vi.mock("../repositories", () => ({ PortalRepository: repo }));
vi.mock("../../estimates/repositories", () => ({
	EstimatesRepository: estimatesRepo,
}));
vi.mock("../../estimates/services", () => ({
	EstimatesService: estimatesService,
}));
vi.mock("@fixr/mail/queue", () => ({
	createEmailQueue: vi.fn(() => "email-queue"),
	queueEmail,
}));

const { PortalService } = await import(".");

const companyId = createId();
const userJwt = {
	id: createId(),
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	company: {
		id: companyId,
		name: "Central",
		subdomain: "central",
		role: "manager" as const,
	},
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("PortalService.requestAccess", () => {
	it("sends one link per CPF registered with the email, normalized", async () => {
		repo.queryClientsByEmail.mockResolvedValue([
			{ id: "c1", cpf: "111", name: "Maria" },
			{ id: "c2", cpf: "111", name: "Maria O." },
			{ id: "c3", cpf: "222", name: "João" },
		]);
		const reply = createFakeReply();

		await PortalService.requestAccess({
			email: " Maria@Fixr.TEST ",
			locale: "pt-BR",
			response: asReply(reply),
		});

		expect(repo.queryClientsByEmail).toHaveBeenCalledWith("maria@fixr.test");
		expect(repo.insertLink).toHaveBeenCalledTimes(2);
		expect(repo.insertLink.mock.calls.map(([link]) => link.cpf)).toEqual([
			"111",
			"222",
		]);
		const [, { payload }] = queueEmail.mock.calls[0]!;
		const token = payload.ctaUrl.split("/portal/")[1];
		expect(repo.insertLink.mock.calls[0]![0].tokenHash).toBe(
			hashOpaqueToken(token)
		);
		expect(payload).toMatchObject({
			to: "maria@fixr.test",
			clientName: "Maria",
			companyName: null,
		});
		expect(reply.state.statusCode).toBe(202);
	});

	it("answers 202 without sending anything for an unknown email", async () => {
		repo.queryClientsByEmail.mockResolvedValue([]);
		const reply = createFakeReply();

		await PortalService.requestAccess({
			email: "nobody@fixr.test",
			locale: "en",
			response: asReply(reply),
		});

		expect(queueEmail).not.toHaveBeenCalled();
		expect(reply.state.statusCode).toBe(202);
	});
});

describe("PortalService.sendAccess", () => {
	const client = {
		id: createId(),
		companyId,
		cpf: "52998224725",
		name: "Maria",
		email: "Maria@Fixr.test",
		deletedAt: null,
	};
	const send = () =>
		PortalService.sendAccess({
			userJwt,
			subdomain: "central",
			clientId: client.id,
			locale: "pt-BR",
			response: asReply(createFakeReply()),
		});

	it("revokes the shop's previous links before issuing a new one", async () => {
		repo.queryClient.mockResolvedValue(client);

		await send();

		expect(repo.revokeShopLinks).toHaveBeenCalledWith(client.id, companyId);
		expect(repo.insertLink).toHaveBeenCalledWith(
			expect.objectContaining({
				cpf: client.cpf,
				email: "maria@fixr.test",
				companyId,
				clientId: client.id,
			})
		);
		expect(queueEmail.mock.calls[0]![1].payload.companyName).toBe("Central");
	});

	it.each([
		["another company's client", { companyId: createId() }, "client_not_found"],
		["a deleted client", { deletedAt: new Date() }, "client_not_found"],
		["a client without email", { email: null }, "portal_client_no_email"],
	])("refuses %s", async (_name, override, code) => {
		repo.queryClient.mockResolvedValue({ ...client, ...override });

		await expect(send()).rejects.toMatchObject({ code });
		expect(repo.insertLink).not.toHaveBeenCalled();
	});

	it("refuses another company's subdomain", async () => {
		await expect(
			PortalService.sendAccess({
				userJwt,
				subdomain: "other",
				clientId: client.id,
				locale: "pt-BR",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "not_allowed" });
	});
});

describe("PortalService sessions", () => {
	it("opens a session with the link's identity and an opaque cookie", async () => {
		repo.queryActiveLink.mockResolvedValue({
			id: "l1",
			cpf: "111",
			email: "maria@fixr.test",
			clientId: "c1",
		});
		const reply = createFakeReply();

		await PortalService.openFromPortalLink({
			token: "link-token",
			response: asReply(reply),
		});

		const cookie = reply.state.cookies[PORTAL_SESSION_COOKIE]!;
		expect(cookie.options).toMatchObject({ httpOnly: true, secure: true });
		expect(repo.insertSession).toHaveBeenCalledWith(
			expect.objectContaining({
				tokenHash: hashOpaqueToken(cookie.value),
				portalLinkId: "l1",
				cpf: "111",
				email: "maria@fixr.test",
				clientId: "c1",
			})
		);
		expect(repo.touchLink).toHaveBeenCalledWith("l1");
	});

	it("refuses a revoked or unknown link", async () => {
		repo.queryActiveLink.mockResolvedValue(null);

		await expect(
			PortalService.openFromPortalLink({
				token: "x",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "portal_link_invalid" });
	});

	it("takes the identity's email from where the estimate was sent", async () => {
		estimatesRepo.queryByTokenHash.mockResolvedValue({
			clientId: "c1",
			sentTo: "Outro@Fixr.test",
		});
		repo.queryClient.mockResolvedValue({
			id: "c1",
			cpf: "111",
			deletedAt: null,
		});

		await PortalService.openFromEstimateLink({
			token: "estimate-token",
			response: asReply(createFakeReply()),
		});

		expect(estimatesRepo.queryByTokenHash).toHaveBeenCalledWith(
			hashOpaqueToken("estimate-token")
		);
		expect(repo.insertSession).toHaveBeenCalledWith(
			expect.objectContaining({
				cpf: "111",
				email: "outro@fixr.test",
				clientId: "c1",
				portalLinkId: null,
			})
		);
	});

	it("refuses an estimate link whose client is gone", async () => {
		estimatesRepo.queryByTokenHash.mockResolvedValue({
			clientId: null,
			sentTo: "a@fixr.test",
		});

		await expect(
			PortalService.openFromEstimateLink({
				token: "t",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "portal_link_invalid" });
	});
});

describe("PortalService.answerEstimate", () => {
	const identity = { cpf: "111", email: "maria@fixr.test", clientId: "c1" };
	const answer = () =>
		PortalService.answerEstimate({
			identity,
			estimateId: "e1",
			answer: { status: "approved" },
			response: asReply(createFakeReply()),
		});

	it("refuses an estimate outside the client's scope", async () => {
		repo.queryScopeClients.mockResolvedValue([{ id: "c1", name: "Maria" }]);
		repo.queryEstimate.mockResolvedValue(null);

		await expect(answer()).rejects.toMatchObject({
			code: "estimate_not_found",
		});
		expect(repo.queryEstimate).toHaveBeenCalledWith("e1", ["c1"]);
	});

	it("refuses an estimate that was already answered", async () => {
		repo.queryScopeClients.mockResolvedValue([{ id: "c1", name: "Maria" }]);
		repo.queryEstimate.mockResolvedValue({
			id: "e1",
			status: "approved",
			validUntil: new Date(Date.now() + 60_000),
		});

		await expect(answer()).rejects.toMatchObject({
			code: "estimate_already_answered",
		});
		expect(estimatesService.recordAnswer).not.toHaveBeenCalled();
	});

	it("refuses an expired estimate", async () => {
		repo.queryScopeClients.mockResolvedValue([{ id: "c1", name: "Maria" }]);
		repo.queryEstimate.mockResolvedValue({
			id: "e1",
			status: "sent",
			validUntil: new Date(Date.now() - 60_000),
		});

		await expect(answer()).rejects.toMatchObject({ code: "estimate_expired" });
	});
});
