import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryCustomerById: vi.fn(),
		queryCustomerByCpf: vi.fn(),
		queryRecentServiceOrders: vi.fn(),
		insertCustomer: vi.fn(),
		updateCustomer: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({ CustomersRepository: repo }));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { CustomersService } = await import(".");

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
		role: "manager" as const,
	},
};
const customer = {
	id: createId(),
	companyId,
	cpf: "52998224725",
	deletedAt: null,
};
const body = {
	name: "Maria",
	email: "maria@cliente.com",
	cpf: "529.982.247-25",
	phone: "(11) 99876-5432",
	address: "Rua A, 1",
	state: "sp",
	city: "São Paulo",
};

const create = (data = body) =>
	CustomersService.createCustomer({
		userJwt,
		subdomain: "fixr",
		data,
		response: asReply(createFakeReply()),
	});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CustomersService.createCustomer", () => {
	it("normalizes documents, phones and state before inserting", async () => {
		repo.queryCustomerByCpf.mockResolvedValue(null);
		repo.insertCustomer.mockResolvedValue(customer.id);
		repo.queryCustomerById.mockResolvedValue(customer);

		await create();

		expect(repo.insertCustomer).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId,
				cpf: "52998224725",
				phone: "11998765432",
				state: "SP",
			})
		);
	});

	it("refuses an active customer with the same CPF", async () => {
		repo.queryCustomerByCpf.mockResolvedValue({
			id: customer.id,
			deletedAt: null,
		});

		await expect(create()).rejects.toMatchObject({
			code: "customer_cpf_conflict",
		});
	});

	it("restores a deleted customer with the same CPF", async () => {
		repo.queryCustomerByCpf.mockResolvedValue({
			id: customer.id,
			deletedAt: new Date(),
		});
		repo.queryCustomerById.mockResolvedValue(customer);

		await create();

		expect(repo.insertCustomer).not.toHaveBeenCalled();
		expect(repo.updateCustomer).toHaveBeenCalledWith(
			customer.id,
			expect.objectContaining({ deletedAt: null, alternativePhone: null })
		);
	});

	it("rejects a phone that is not 10 or 11 digits", async () => {
		await expect(create({ ...body, phone: "123" })).rejects.toMatchObject({
			code: "customer_phone_invalid",
		});
	});
});

describe("CustomersService.getCustomer", () => {
	it.each([
		["another company", { ...customer, companyId: createId() }],
		["a deleted customer", { ...customer, deletedAt: new Date() }],
	])("reports %s as not found", async (_label, stored) => {
		repo.queryCustomerById.mockResolvedValue(stored);

		await expect(
			CustomersService.getCustomer({
				userJwt,
				subdomain: "fixr",
				customerId: customer.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "customer_not_found" });
	});

	it("includes the recent service orders of the company", async () => {
		repo.queryCustomerById.mockResolvedValue(customer);
		repo.queryRecentServiceOrders.mockResolvedValue([{ id: "so" }]);
		const reply = createFakeReply();

		await CustomersService.getCustomer({
			userJwt,
			subdomain: "fixr",
			customerId: customer.id,
			response: asReply(reply),
		});

		expect(repo.queryRecentServiceOrders).toHaveBeenCalledWith(
			customer.id,
			companyId
		);
		expect(reply.state.body).toMatchObject({
			data: { id: customer.id, serviceOrders: [{ id: "so" }] },
		});
	});
});

describe("CustomersService.deleteCustomer", () => {
	it("marks the customer as deleted instead of removing it", async () => {
		repo.queryCustomerById.mockResolvedValue(customer);

		await CustomersService.deleteCustomer({
			userJwt,
			subdomain: "fixr",
			customerId: customer.id,
			response: asReply(createFakeReply()),
		});

		expect(repo.updateCustomer).toHaveBeenCalledWith(customer.id, {
			deletedAt: expect.any(Date),
		});
	});
});

describe("CustomersService.listCustomers", () => {
	it("throws past the last page", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(2);

		await expect(
			CustomersService.listCustomers({
				userJwt,
				subdomain: "fixr",
				page: 3,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});
});
