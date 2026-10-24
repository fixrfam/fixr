import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryClientById: vi.fn(),
		queryClientByCpf: vi.fn(),
		queryRecentServiceOrders: vi.fn(),
		insertClient: vi.fn(),
		updateClient: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({ ClientsRepository: repo }));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { ClientsService } = await import(".");

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
const client = {
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
	ClientsService.createClient({
		userJwt,
		subdomain: "fixr",
		data,
		response: asReply(createFakeReply()),
	});

afterEach(() => {
	vi.clearAllMocks();
});

describe("ClientsService.createClient", () => {
	it("normalizes documents, phones and state before inserting", async () => {
		repo.queryClientByCpf.mockResolvedValue(null);
		repo.insertClient.mockResolvedValue(client.id);
		repo.queryClientById.mockResolvedValue(client);

		await create();

		expect(repo.insertClient).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId,
				cpf: "52998224725",
				phone: "11998765432",
				state: "SP",
			})
		);
	});

	it("refuses an active client with the same CPF", async () => {
		repo.queryClientByCpf.mockResolvedValue({ id: client.id, deletedAt: null });

		await expect(create()).rejects.toMatchObject({
			code: "client_cpf_conflict",
		});
	});

	it("restores a deleted client with the same CPF", async () => {
		repo.queryClientByCpf.mockResolvedValue({
			id: client.id,
			deletedAt: new Date(),
		});
		repo.queryClientById.mockResolvedValue(client);

		await create();

		expect(repo.insertClient).not.toHaveBeenCalled();
		expect(repo.updateClient).toHaveBeenCalledWith(
			client.id,
			expect.objectContaining({ deletedAt: null, alternativePhone: null })
		);
	});

	it("rejects a phone that is not 10 or 11 digits", async () => {
		await expect(create({ ...body, phone: "123" })).rejects.toMatchObject({
			code: "client_phone_invalid",
		});
	});
});

describe("ClientsService.getClient", () => {
	it.each([
		["another company", { ...client, companyId: createId() }],
		["a deleted client", { ...client, deletedAt: new Date() }],
	])("reports %s as not found", async (_label, stored) => {
		repo.queryClientById.mockResolvedValue(stored);

		await expect(
			ClientsService.getClient({
				userJwt,
				subdomain: "fixr",
				clientId: client.id,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "client_not_found" });
	});

	it("includes the recent service orders of the company", async () => {
		repo.queryClientById.mockResolvedValue(client);
		repo.queryRecentServiceOrders.mockResolvedValue([{ id: "so" }]);
		const reply = createFakeReply();

		await ClientsService.getClient({
			userJwt,
			subdomain: "fixr",
			clientId: client.id,
			response: asReply(reply),
		});

		expect(repo.queryRecentServiceOrders).toHaveBeenCalledWith(
			client.id,
			companyId
		);
		expect(reply.state.body).toMatchObject({
			data: { id: client.id, serviceOrders: [{ id: "so" }] },
		});
	});
});

describe("ClientsService.deleteClient", () => {
	it("marks the client as deleted instead of removing it", async () => {
		repo.queryClientById.mockResolvedValue(client);

		await ClientsService.deleteClient({
			userJwt,
			subdomain: "fixr",
			clientId: client.id,
			response: asReply(createFakeReply()),
		});

		expect(repo.updateClient).toHaveBeenCalledWith(client.id, {
			deletedAt: expect.any(Date),
		});
	});
});

describe("ClientsService.listClients", () => {
	it("throws past the last page", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(2);

		await expect(
			ClientsService.listClients({
				userJwt,
				subdomain: "fixr",
				page: 3,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});
});
