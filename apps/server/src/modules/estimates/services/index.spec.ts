import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pdf } = vi.hoisted(() => ({
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
	},
	pdf: {
		renderEstimatePdf: vi.fn(async () => Buffer.from("%PDF-")),
		fetchLogo: vi.fn(async () => null),
	},
}));

vi.mock("../repositories", () => ({
	EstimatesRepository: repo,
	estimatesListJoins: [],
	estimatesListSelect: {},
}));
vi.mock("../pdf/render", () => pdf);

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
	it.each([
		["draft", "sent"],
		["sent", "approved"],
		["sent", "rejected"],
		["sent", "draft"],
		["rejected", "draft"],
	] as const)("moves %s to %s", async (from, to) => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: from });

		await EstimatesService.updateStatus({
			...base,
			status: to,
			response: asReply(createFakeReply()),
		});

		expect(repo.updateEstimate).toHaveBeenCalledWith(estimateId, {
			status: to,
		});
	});

	it.each([
		["draft", "approved"],
		["approved", "draft"],
		["approved", "rejected"],
		["rejected", "approved"],
	] as const)("refuses %s to %s", async (from, to) => {
		repo.queryEstimate.mockResolvedValue({ ...estimate, status: from });

		await expect(
			EstimatesService.updateStatus({
				...base,
				status: to,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "estimate_invalid_transition" });
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
