import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		querySupplierById: vi.fn(),
		querySupplierByCnpj: vi.fn(),
		countPartsBySupplier: vi.fn(),
		insertSupplier: vi.fn(),
		updateSupplier: vi.fn(),
		deleteSupplier: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({ SuppliersRepository: repo }));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { SuppliersService } = await import(".");

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
		role: "admin" as const,
	},
};
const supplier = {
	id: createId(),
	companyId,
	name: "TechParts",
	cnpj: "12345678000190",
};
const body = {
	name: "TechParts",
	cnpj: "12.345.678/0001-90",
	contact: "Renata",
	phone: "11999999999",
	email: "vendas@techparts.com.br",
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("SuppliersService company scoping", () => {
	it("rejects a user without company", async () => {
		await expect(
			SuppliersService.getSupplier({
				userJwt: { ...userJwt, company: undefined } as never,
				subdomain: "fixr",
				supplierId: supplier.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "company_not_found" });
	});

	it("rejects another company's subdomain", async () => {
		await expect(
			SuppliersService.getSupplier({
				userJwt,
				subdomain: "other",
				supplierId: supplier.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "not_allowed" });
	});

	it("reports another tenant's supplier as not found", async () => {
		repo.querySupplierById.mockResolvedValue({
			...supplier,
			companyId: createId(),
		});

		await expect(
			SuppliersService.getSupplier({
				userJwt,
				subdomain: "fixr",
				supplierId: supplier.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "supplier_not_found" });
	});
});

describe("SuppliersService.listSuppliers", () => {
	it("throws when the page is past the last one", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(3);

		await expect(
			SuppliersService.listSuppliers({
				userJwt,
				subdomain: "fixr",
				page: 2,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});

	it("returns the records with their pagination", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([supplier]);
		pagination.getPaginatedCount.mockResolvedValue(1);
		const reply = createFakeReply();

		await SuppliersService.listSuppliers({
			userJwt,
			subdomain: "fixr",
			page: 1,
			query: "Tech",
			response: asReply(reply),
		});

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, "Tech");
		expect(reply.state.body).toMatchObject({
			code: "list_suppliers_success",
			data: { records: [supplier], pagination: { total_records: 1 } },
		});
	});
});

describe("SuppliersService.createSupplier", () => {
	it("stores the CNPJ with digits only", async () => {
		repo.querySupplierByCnpj.mockResolvedValue(null);
		repo.insertSupplier.mockResolvedValue(supplier.id);
		repo.querySupplierById.mockResolvedValue(supplier);
		const reply = createFakeReply();

		await SuppliersService.createSupplier({
			userJwt,
			subdomain: "fixr",
			data: body,
			response: asReply(reply),
		});

		expect(repo.insertSupplier).toHaveBeenCalledWith(
			expect.objectContaining({ cnpj: "12345678000190", companyId })
		);
		expect(reply.state.statusCode).toBe(201);
	});

	it("refuses a CNPJ already used in the company", async () => {
		repo.querySupplierByCnpj.mockResolvedValue({ id: createId() });

		await expect(
			SuppliersService.createSupplier({
				userJwt,
				subdomain: "fixr",
				data: body,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "supplier_cnpj_conflict" });
		expect(repo.insertSupplier).not.toHaveBeenCalled();
	});
});

describe("SuppliersService.patchSupplier", () => {
	it("allows keeping its own CNPJ", async () => {
		repo.querySupplierById.mockResolvedValue(supplier);
		repo.querySupplierByCnpj.mockResolvedValue({ id: supplier.id });
		const reply = createFakeReply();

		await SuppliersService.patchSupplier({
			userJwt,
			subdomain: "fixr",
			supplierId: supplier.id,
			data: { cnpj: body.cnpj },
			response: asReply(reply),
		});

		expect(repo.updateSupplier).toHaveBeenCalledWith(supplier.id, {
			cnpj: "12345678000190",
		});
		expect(reply.state.body).toMatchObject({ code: "patch_supplier_success" });
	});
});

describe("SuppliersService.deleteSupplier", () => {
	it("refuses while parts reference the supplier", async () => {
		repo.querySupplierById.mockResolvedValue(supplier);
		repo.countPartsBySupplier.mockResolvedValue(2);

		await expect(
			SuppliersService.deleteSupplier({
				userJwt,
				subdomain: "fixr",
				supplierId: supplier.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "supplier_in_use" });
		expect(repo.deleteSupplier).not.toHaveBeenCalled();
	});

	it("deletes an unused supplier", async () => {
		repo.querySupplierById.mockResolvedValue(supplier);
		repo.countPartsBySupplier.mockResolvedValue(0);
		const reply = createFakeReply();

		await SuppliersService.deleteSupplier({
			userJwt,
			subdomain: "fixr",
			supplierId: supplier.id,
			response: asReply(reply),
		});

		expect(repo.deleteSupplier).toHaveBeenCalledWith(supplier.id);
		expect(reply.state.body).toMatchObject({ code: "delete_supplier_success" });
	});
});
