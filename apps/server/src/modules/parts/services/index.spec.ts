import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryPartById: vi.fn(),
		queryPartBySku: vi.fn(),
		querySupplierOfCompany: vi.fn(),
		insertPart: vi.fn(),
		updatePart: vi.fn(),
		deletePart: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({
	PartsRepository: repo,
	partsListJoins: ["JOINS"],
	partsListSelect: {},
}));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { PartsService } = await import(".");

const companyId = createId();
const supplierId = createId();
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
const part = {
	id: createId(),
	companyId,
	supplierId,
	sku: "SKU-1",
	costPrice: 100,
	salePrice: 180,
	supplier: { id: supplierId, name: "TechParts" },
};
const body = {
	sku: "SKU-1",
	name: "Bateria",
	category: "Baterias",
	costPrice: 100,
	salePrice: 180,
	stock: 1,
	minStock: 0,
	supplierId,
};

const call = {
	create: (data = body) =>
		PartsService.createPart({
			userJwt,
			subdomain: "fixr",
			data,
			response: asReply(createFakeReply()),
		}),
	patch: (data: Record<string, unknown>, reply = createFakeReply()) =>
		PartsService.patchPart({
			userJwt,
			subdomain: "fixr",
			partId: part.id,
			data,
			response: asReply(reply),
		}),
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("PartsService.listParts", () => {
	it("forwards the filters scoped to the company", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([part]);
		pagination.getPaginatedCount.mockResolvedValue(1);
		const reply = createFakeReply();

		await PartsService.listParts({
			userJwt,
			subdomain: "fixr",
			page: 1,
			category: "Baterias",
			lowStock: "true",
			response: asReply(reply),
		});

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, {
			query: undefined,
			category: "Baterias",
			supplierId: undefined,
			lowStock: "true",
		});
		expect(reply.state.body).toMatchObject({ data: { records: [part] } });
	});
});

describe("PartsService.createPart", () => {
	it("refuses a supplier outside the company", async () => {
		repo.querySupplierOfCompany.mockResolvedValue(null);
		repo.queryPartBySku.mockResolvedValue(null);

		await expect(call.create()).rejects.toMatchObject({
			code: "part_supplier_not_found",
		});
		expect(repo.insertPart).not.toHaveBeenCalled();
	});

	it("refuses a SKU already used in the company", async () => {
		repo.querySupplierOfCompany.mockResolvedValue({ id: supplierId });
		repo.queryPartBySku.mockResolvedValue({ id: createId() });

		await expect(call.create()).rejects.toMatchObject({
			code: "part_sku_conflict",
		});
	});

	it("creates the part in the caller's company", async () => {
		repo.querySupplierOfCompany.mockResolvedValue({ id: supplierId });
		repo.queryPartBySku.mockResolvedValue(null);
		repo.insertPart.mockResolvedValue(part.id);
		repo.queryPartById.mockResolvedValue(part);

		await call.create();

		expect(repo.insertPart).toHaveBeenCalledWith(
			expect.objectContaining({ companyId, description: null })
		);
	});
});

describe("PartsService.patchPart", () => {
	it("compares a lone sale price with the stored cost price", async () => {
		repo.queryPartById.mockResolvedValue(part);

		await expect(call.patch({ salePrice: 50 })).rejects.toMatchObject({
			code: "part_sale_price_below_cost",
		});
		expect(repo.updatePart).not.toHaveBeenCalled();
	});

	it("allows keeping its own SKU", async () => {
		repo.queryPartById.mockResolvedValue(part);
		repo.queryPartBySku.mockResolvedValue({ id: part.id });
		const reply = createFakeReply();

		await call.patch({ sku: "SKU-1", stock: 3 }, reply);

		expect(repo.updatePart).toHaveBeenCalledWith(part.id, {
			sku: "SKU-1",
			stock: 3,
		});
		expect(reply.state.body).toMatchObject({ code: "patch_part_success" });
	});

	it("reports another tenant's part as not found", async () => {
		repo.queryPartById.mockResolvedValue({ ...part, companyId: createId() });

		await expect(call.patch({ stock: 1 })).rejects.toMatchObject({
			code: "part_not_found",
		});
	});
});

describe("PartsService.deletePart", () => {
	it("deletes the company's part", async () => {
		repo.queryPartById.mockResolvedValue(part);
		const reply = createFakeReply();

		await PartsService.deletePart({
			userJwt,
			subdomain: "fixr",
			partId: part.id,
			response: asReply(reply),
		});

		expect(repo.deletePart).toHaveBeenCalledWith(part.id);
		expect(reply.state.body).toMatchObject({ code: "delete_part_success" });
	});
});
