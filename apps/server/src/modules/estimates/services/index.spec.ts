import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pdf, queueEmail, emit } = vi.hoisted(() => ({
	emit: vi.fn(),
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		queryEstimate: vi.fn(),
		queryItemsByEstimateIds: vi.fn(),
		queryServiceOrderOfCompany: vi.fn(),
		queryServiceOrderItems: vi.fn(),
		queryEmployee: vi.fn(),
		createWithItems: vi.fn(),
		updateEstimate: vi.fn(),
		deleteEstimate: vi.fn(),
		queryPdfContext: vi.fn(),
		queryClient: vi.fn(),
		queryByTokenHash: vi.fn(),
		markSent: vi.fn(),
		recordAnswer: vi.fn(async () => true),
	},
	pdf: {
		renderEstimatePdf: vi.fn(async () => Buffer.from("%PDF-")),
		fetchLogo: vi.fn(async () => null),
	},
	queueEmail: vi.fn(),
}));

vi.mock("../repositories", () => ({
	EstimatesRepository: repo,
	estimatesListJoins: [],
	estimatesListSelect: {},
}));
vi.mock("../pdf/render", () => pdf);
vi.mock("../../../core/lib/transaction", () => ({
	inTransaction: (work: (tx: unknown) => unknown) => work("TX"),
}));
vi.mock("../../../core/events", () => ({ events: { emit } }));
vi.mock("@fixr/mail/queue", () => ({
	createEmailQueue: vi.fn(() => "email-queue"),
	queueEmail,
}));

const { EstimatesService } = await import(".");

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
		name: "Fixr",
		subdomain: "fixr",
		role: "financial" as const,
	},
};
const estimateId = createId();
const serviceOrderId = createId();
const estimate = {
	id: estimateId,
	companyId,
	serviceOrderId,
	clientId: createId(),
	clientName: "Maria",
	createdBy: null,
	number: 3,
	status: "draft" as const,
	discountPercentage: 0,
	validUntil: new Date(),
	notes: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};
const item = {
	id: createId(),
	estimateId,
	type: "part" as const,
	partId: null,
	serviceId: null,
	name: "Tela",
	quantity: 2,
	unitPrice: 100,
	position: 0,
};
const base = { userJwt, subdomain: "fixr", estimateId };

beforeEach(() => {
	repo.queryEstimate.mockResolvedValue(estimate);
	repo.queryItemsByEstimateIds.mockResolvedValue(
		new Map([[estimateId, [item]]])
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("EstimatesService.createEstimate", () => {
	const create = (data: Record<string, unknown> = {}) =>
		EstimatesService.createEstimate({
			userJwt,
			subdomain: "fixr",
			data: { serviceOrderId, ...data },
			response: asReply(createFakeReply()),
		});

	it("copies the order items with the client and a 30-day validity", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
		repo.queryServiceOrderOfCompany.mockResolvedValue({
			id: serviceOrderId,
			clientId: estimate.clientId,
		});
		repo.queryServiceOrderItems.mockResolvedValue([
			{ ...item, serviceOrderId, createdAt: new Date() },
		]);
		repo.queryEmployee.mockResolvedValue({ id: "emp" });
		repo.createWithItems.mockResolvedValue(estimateId);

		await create();
		vi.useRealTimers();

		expect(repo.createWithItems).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId,
				serviceOrderId,
				clientId: estimate.clientId,
				createdBy: "emp",
				discountPercentage: 0,
				validUntil: new Date("2026-10-31T00:00:00Z"),
			}),
			[
				{
					id: expect.any(String),
					parentItemId: null,
					type: "part",
					partId: null,
					serviceId: null,
					name: "Tela",
					quantity: 2,
					unitPrice: 100,
				},
			]
		);
	});

	it("keeps the parts a service uses under it, right after the service", async () => {
		const serviceLine = {
			...item,
			id: createId(),
			type: "service" as const,
			name: "Troca de tela",
			quantity: 1,
			unitPrice: 150,
			parentItemId: null,
		};
		// Added before the service, then moved under it.
		const screen = { ...item, parentItemId: serviceLine.id };
		const cable = {
			...item,
			id: createId(),
			name: "Cabo",
			parentItemId: null,
		};
		repo.queryServiceOrderOfCompany.mockResolvedValue({
			id: serviceOrderId,
			clientId: estimate.clientId,
		});
		repo.queryServiceOrderItems.mockResolvedValue([screen, serviceLine, cable]);
		repo.createWithItems.mockResolvedValue(estimateId);

		await create();

		const [, copied] = repo.createWithItems.mock.calls[0]!;
		expect(copied.map((line: { name: string }) => line.name)).toEqual([
			"Troca de tela",
			"Tela",
			"Cabo",
		]);
		expect(copied[1].parentItemId).toBe(copied[0].id);
		expect(copied[0].id).not.toBe(serviceLine.id);
		expect(copied[0].parentItemId).toBeNull();
		expect(copied[2].parentItemId).toBeNull();
	});

	it("refuses an order of another company", async () => {
		repo.queryServiceOrderOfCompany.mockResolvedValue(null);

		await expect(create()).rejects.toMatchObject({
			code: "estimate_service_order_not_found",
		});
	});

	it("refuses an order without items", async () => {
		repo.queryServiceOrderOfCompany.mockResolvedValue({ id: serviceOrderId });
		repo.queryServiceOrderItems.mockResolvedValue([]);

		await expect(create()).rejects.toMatchObject({
			code: "estimate_service_order_empty",
		});
		expect(repo.createWithItems).not.toHaveBeenCalled();
	});
});

describe("EstimatesService.updateStatus", () => {
	const move = (to: "draft" | "sent" | "approved" | "rejected") =>
		EstimatesService.updateStatus({
			...base,
			status: to,
			response: asReply(createFakeReply()),
		});

	it("marks a draft as sent without a public link", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "draft" });

		await move("sent");

		expect(repo.markSent).toHaveBeenCalledWith("TX", estimateId, {
			publicTokenHash: null,
			sentTo: null,
		});
		expect(emit).toHaveBeenCalledWith(
			"TX",
			"estimate.sent",
			expect.objectContaining({ estimateId, serviceOrderId })
		);
	});

	it("records the approval like the client link does", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "sent" });

		await move("approved");

		expect(repo.recordAnswer).toHaveBeenCalledWith("TX", estimateId, {
			status: "approved",
		});
		expect(emit).toHaveBeenCalledWith(
			"TX",
			"estimate.approved",
			expect.objectContaining({ estimateId, serviceOrderId })
		);
	});

	it("records a rejection without a reason", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "sent" });

		await move("rejected");

		expect(repo.recordAnswer).toHaveBeenCalledWith("TX", estimateId, {
			status: "rejected",
			rejectionReason: null,
		});
		expect(emit).not.toHaveBeenCalled();
	});

	it.each([
		"sent",
		"rejected",
	] as const)("moves %s back to draft and disables the link", async (from) => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: from });

		await move("draft");

		expect(repo.updateEstimate).toHaveBeenCalledWith(estimateId, {
			status: "draft",
			publicTokenHash: null,
		});
	});

	it("refuses an answer that lost a race with the client", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "sent" });
		repo.recordAnswer.mockResolvedValueOnce(false);

		await expect(move("approved")).rejects.toMatchObject({
			code: "estimate_invalid_transition",
		});
	});

	it.each([
		["draft", "approved"],
		["approved", "draft"],
		["approved", "rejected"],
		["rejected", "approved"],
	] as const)("refuses %s to %s", async (from, to) => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: from });

		await expect(move(to)).rejects.toMatchObject({
			code: "estimate_invalid_transition",
		});
	});
});

describe("EstimatesService.sendEstimate", () => {
	const future = new Date(Date.now() + 86_400_000);
	const context = {
		serviceOrderNumber: 12,
		subdomain: "fixr",
		company: {
			name: "Central",
			cnpj: "12345678000190",
			address: "Rua A",
			email: null,
			phone: null,
			website: null,
			logoUrl: null,
		},
		device: { maker: "Samsung", model: "S21", reportedDefect: "Tela" },
	};
	const send = (email?: string) =>
		EstimatesService.sendEstimate({
			...base,
			email,
			locale: "pt-BR",
			response: asReply(createFakeReply()),
		});

	beforeEach(() => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, validUntil: future });
		repo.queryPdfContext.mockResolvedValue(context);
		repo.queryClient.mockResolvedValue({
			name: "Maria",
			email: "maria@fixr.test",
		});
	});

	it("queues the email with the PDF and a link whose hash is stored", async () => {
		await send();

		const [, , { publicTokenHash, sentTo }] = repo.markSent.mock.calls[0]!;
		expect(sentTo).toBe("maria@fixr.test");

		const [, { job, payload }] = queueEmail.mock.calls[0]!;
		expect(job).toBe("sendEstimateEmail");
		expect(payload).toMatchObject({
			to: "maria@fixr.test",
			clientName: "Maria",
			companyName: "Central",
			number: "0003",
			device: "Samsung S21",
			locale: "pt-BR",
		});
		expect(payload.attachment.contentBase64).toBe(
			Buffer.from("%PDF-").toString("base64")
		);

		const token = payload.ctaUrl.split("/estimate/")[1];
		expect(token).toHaveLength(43);
		const { createHash } = await import("node:crypto");
		expect(publicTokenHash).toBe(
			createHash("sha256").update(token).digest("hex")
		);
		expect(publicTokenHash).not.toContain(token);
	});

	it("sends to the given email over the client's", async () => {
		await send("outro@fixr.test");

		expect(queueEmail.mock.calls[0]![1].payload.to).toBe("outro@fixr.test");
	});

	it("refuses when nobody has an email", async () => {
		repo.queryClient.mockResolvedValue({ name: "Maria", email: null });

		await expect(send()).rejects.toMatchObject({
			code: "estimate_no_recipient",
		});
		expect(repo.markSent).not.toHaveBeenCalled();
	});

	it("refuses an expired estimate", async () => {
		repo.queryEstimate.mockResolvedValue({
			...estimate,
			validUntil: new Date(Date.now() - 1000),
		});

		await expect(send()).rejects.toMatchObject({ code: "estimate_expired" });
	});

	it.each([
		"approved",
		"rejected",
	] as const)("refuses a %s estimate", async (status) => {
		repo.queryEstimate.mockResolvedValue({
			...estimate,
			status,
			validUntil: future,
		});

		await expect(send()).rejects.toMatchObject({
			code: "estimate_invalid_transition",
		});
	});
});

describe("EstimatesService.answerEstimate", () => {
	const token = "t".repeat(43);
	const sent = {
		...estimate,
		status: "sent" as const,
		validUntil: new Date(Date.now() + 86_400_000),
	};
	const answer = (
		value: { status: "approved" } | { status: "rejected"; reason?: string }
	) =>
		EstimatesService.answerEstimate({
			token,
			answer: value,
			response: asReply(createFakeReply()),
		});

	beforeEach(() => {
		repo.queryByTokenHash.mockResolvedValue(sent);
		repo.queryPdfContext.mockResolvedValue({
			serviceOrderNumber: 12,
			subdomain: "fixr",
			company: { name: "Central" },
			device: { maker: "Samsung", model: "S21", reportedDefect: "Tela" },
		});
	});

	it("records a rejection with its reason", async () => {
		await answer({ status: "rejected", reason: "Caro" });

		expect(repo.recordAnswer).toHaveBeenCalledWith("TX", sent.id, {
			status: "rejected",
			rejectionReason: "Caro",
		});
	});

	it("refuses an unknown link", async () => {
		repo.queryByTokenHash.mockResolvedValue(null);

		await expect(answer({ status: "approved" })).rejects.toMatchObject({
			code: "estimate_link_invalid",
		});
	});

	it("refuses an estimate that was already answered", async () => {
		repo.queryByTokenHash.mockResolvedValue({ ...sent, status: "approved" });

		await expect(answer({ status: "rejected" })).rejects.toMatchObject({
			code: "estimate_already_answered",
		});
	});

	it("refuses when another answer won the race", async () => {
		repo.recordAnswer.mockResolvedValueOnce(false);

		await expect(answer({ status: "approved" })).rejects.toMatchObject({
			code: "estimate_already_answered",
		});
	});

	it("refuses an expired estimate", async () => {
		repo.queryByTokenHash.mockResolvedValue({
			...sent,
			validUntil: new Date(Date.now() - 1000),
		});

		await expect(answer({ status: "approved" })).rejects.toMatchObject({
			code: "estimate_expired",
		});
	});
});

describe("EstimatesService.patchEstimate and deleteEstimate", () => {
	it("refuses to edit a sent estimate", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "sent" });

		await expect(
			EstimatesService.patchEstimate({
				...base,
				data: { notes: "x" },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "estimate_not_editable" });
	});

	it("refuses to delete an approved estimate", async () => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: "approved" });

		await expect(
			EstimatesService.deleteEstimate({
				...base,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "estimate_not_editable" });
		expect(repo.deleteEstimate).not.toHaveBeenCalled();
	});
});

describe("EstimatesService.getEstimate", () => {
	it("returns the client summary, line totals and estimate totals", async () => {
		repo.queryEstimate.mockResolvedValue({
			...estimate,
			discountPercentage: 10,
		});
		const reply = createFakeReply();

		await EstimatesService.getEstimate({ ...base, response: asReply(reply) });

		expect(reply.state.body).toMatchObject({
			data: {
				client: { id: estimate.clientId, name: "Maria" },
				items: [{ total: 200 }],
				totals: { subtotal: 200, discount: 20, total: 180 },
			},
		});
	});

	it("reports another company's estimate as not found", async () => {
		repo.queryEstimate.mockResolvedValue(null);

		await expect(
			EstimatesService.getEstimate({
				...base,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "estimate_not_found" });
	});
});

describe("EstimatesService.buildPdf", () => {
	it("passes the company, client, device and totals to the renderer", async () => {
		repo.queryPdfContext.mockResolvedValue({
			serviceOrderNumber: 12,
			subdomain: "fixr",
			company: {
				name: "Fixr",
				cnpj: "1",
				address: null,
				email: null,
				phone: null,
				website: null,
				logoUrl: "https://cdn.test/logo.png",
			},
			device: { maker: "Apple", model: "iPhone", reportedDefect: "Tela" },
		});
		repo.queryClient.mockResolvedValue({ name: "Maria", cpf: "1" });

		const { fileName } = await EstimatesService.buildPdf(
			estimateId,
			companyId,
			"pt-BR"
		);

		expect(pdf.fetchLogo).toHaveBeenCalledWith("https://cdn.test/logo.png");
		expect(pdf.renderEstimatePdf).toHaveBeenCalledWith(
			expect.objectContaining({
				number: 3,
				serviceOrderCode: "FIXR-12",
				company: expect.objectContaining({ name: "Fixr", logo: null }),
				client: { name: "Maria", cpf: "1" },
				device: { maker: "Apple", model: "iPhone", reportedDefect: "Tela" },
				totals: expect.objectContaining({ total: 200 }),
			}),
			"pt-BR"
		);
		expect(fileName).toBe("orcamento-0003.pdf");
	});
});
