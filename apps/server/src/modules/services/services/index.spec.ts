import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryPartIdsByServiceIds: vi.fn(),
		queryServiceById: vi.fn(),
		queryPartIdsOfCompany: vi.fn(),
		insertService: vi.fn(),
		updateService: vi.fn(),
		deleteService: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({ ServicesRepository: repo }));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { ServicesService } = await import(".");

const companyId = createId();
const partId = createId();
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
		role: "admin" as const,
	},
};
const service = {
	id: createId(),
	companyId,
	name: "Troca de tela",
	partIds: [partId],
};
const body = {
	name: "Troca de tela",
	description: "Substituição do display.",
	estimatedDurationMinutes: 60,
	price: 150,
	partIds: [partId, partId],
	deviceCategories: ["Telefonia"],
	testInstructions: [],
	testParameters: [],
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("ServicesService.listServices", () => {
	it("attaches the linked part ids to each record", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([
			{ id: service.id, companyId, name: service.name },
		]);
		pagination.getPaginatedCount.mockResolvedValue(1);
		repo.queryPartIdsByServiceIds.mockResolvedValue(
			new Map([[service.id, [partId]]])
		);
		const reply = createFakeReply();

		await ServicesService.listServices({
			userJwt,
			subdomain: "fixr",
			page: 1,
			response: asReply(reply),
		});

		expect(reply.state.body).toMatchObject({
			data: { records: [{ id: service.id, partIds: [partId] }] },
		});
	});
});

describe("ServicesService.createService", () => {
	it("links each part once", async () => {
		repo.queryPartIdsOfCompany.mockResolvedValue([partId]);
		repo.insertService.mockResolvedValue(service.id);
		repo.queryServiceById.mockResolvedValue(service);
		const reply = createFakeReply();

		await ServicesService.createService({
			userJwt,
			subdomain: "fixr",
			data: body,
			response: asReply(reply),
		});

		expect(repo.queryPartIdsOfCompany).toHaveBeenCalledWith(companyId, [
			partId,
		]);
		expect(repo.insertService).toHaveBeenCalledWith(
			expect.not.objectContaining({ partIds: expect.anything() }),
			[partId]
		);
		expect(reply.state.statusCode).toBe(201);
	});

	it("refuses parts outside the company", async () => {
		repo.queryPartIdsOfCompany.mockResolvedValue([]);

		await expect(
			ServicesService.createService({
				userJwt,
				subdomain: "fixr",
				data: body,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "service_part_not_found" });
		expect(repo.insertService).not.toHaveBeenCalled();
	});
});

describe("ServicesService.patchService", () => {
	it("keeps the linked parts when partIds is not sent", async () => {
		repo.queryServiceById.mockResolvedValue(service);

		await ServicesService.patchService({
			userJwt,
			subdomain: "fixr",
			serviceId: service.id,
			data: { price: 99 },
			response: asReply(createFakeReply()),
		});

		expect(repo.queryPartIdsOfCompany).not.toHaveBeenCalled();
		expect(repo.updateService).toHaveBeenCalledWith(
			service.id,
			{ price: 99 },
			undefined
		);
	});

	it("reports another tenant's service as not found", async () => {
		repo.queryServiceById.mockResolvedValue({
			...service,
			companyId: createId(),
		});

		await expect(
			ServicesService.patchService({
				userJwt,
				subdomain: "fixr",
				serviceId: service.id,
				data: { price: 99 },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "service_not_found" });
	});
});

describe("ServicesService.deleteService", () => {
	it("deletes the company's service", async () => {
		repo.queryServiceById.mockResolvedValue(service);
		const reply = createFakeReply();

		await ServicesService.deleteService({
			userJwt,
			subdomain: "fixr",
			serviceId: service.id,
			response: asReply(reply),
		});

		expect(repo.deleteService).toHaveBeenCalledWith(service.id);
		expect(reply.state.body).toMatchObject({ code: "delete_service_success" });
	});
});
