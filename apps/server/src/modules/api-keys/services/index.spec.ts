import { permissions } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	ApiKeysRepository: {
		getActiveByNameAndEmployee: vi.fn(),
		createApiKey: vi.fn(),
		getByIdAndEmployee: vi.fn(),
		revokeApiKey: vi.fn(),
	},
	CompaniesRepository: { queryCompanyBySubdomain: vi.fn() },
	EmployeesRepository: { getEmployeeByUserAndCompany: vi.fn() },
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({
	ApiKeysRepository: mocks.ApiKeysRepository,
}));
vi.mock("../../companies/repositories", () => ({
	CompaniesRepository: mocks.CompaniesRepository,
}));
vi.mock("../../employees/repositories", () => ({
	EmployeesRepository: mocks.EmployeesRepository,
}));
vi.mock("../../../core/lib/pagination", () => mocks.pagination);

const { ApiKeysService } = await import(".");

const company = { id: createId(), name: "Fixr", subdomain: "fixr" };
const employee = { id: createId(), companyId: company.id };

const jwt = (role = "technician", subdomain = "fixr") => ({
	id: createId(),
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	company: {
		id: company.id,
		name: company.name,
		subdomain,
		role: role as never,
	},
});

beforeEach(() => {
	mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(company);
	mocks.EmployeesRepository.getEmployeeByUserAndCompany.mockResolvedValue(
		employee
	);
	mocks.ApiKeysRepository.getActiveByNameAndEmployee.mockResolvedValue(
		undefined
	);
	mocks.ApiKeysRepository.createApiKey.mockResolvedValue("key-id");
});

afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
});

const create = (data: Record<string, unknown>, userJwt = jwt()) => {
	const reply = createFakeReply();
	return {
		reply,
		promise: ApiKeysService.createApiKey({
			userJwt,
			subdomain: "fixr",
			data: { name: "ERP", scopes: [], ...data } as never,
			response: asReply(reply),
		}),
	};
};

describe("actor resolution (shared by every method)", () => {
	it("rejects another company's subdomain", async () => {
		await expect(
			ApiKeysService.createApiKey({
				userJwt: jwt("admin", "fixr"),
				subdomain: "other",
				data: { name: "ERP", scopes: [] },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "not_allowed" });
	});

	it("rejects a user without company or without an employee record", async () => {
		await expect(
			create({}, { ...jwt(), company: undefined } as never).promise
		).rejects.toMatchObject({ code: "company_not_found" });

		mocks.EmployeesRepository.getEmployeeByUserAndCompany.mockResolvedValue(
			undefined
		);
		await expect(create({}).promise).rejects.toMatchObject({
			code: "company_not_found",
		});
	});
});

describe("ApiKeysService.createApiKey", () => {
	it("stores only the hash and returns the plaintext secret once", async () => {
		const { reply, promise } = create({
			scopes: [permissions.serviceOrders.read],
		});
		await promise;

		const [stored] = mocks.ApiKeysRepository.createApiKey.mock.calls[0]!;
		const { data } = reply.state.body as {
			data: { secret: string; prefix: string };
		};
		expect(reply.state.statusCode).toBe(201);
		expect(data.secret.startsWith(`fxr_${data.prefix}_`)).toBe(true);
		expect(stored).toMatchObject({
			name: "ERP",
			prefix: data.prefix,
			employeeId: employee.id,
			companyId: company.id,
			scopes: [permissions.serviceOrders.read],
			expiresAt: null,
		});
		expect(stored).not.toHaveProperty("secret");
		expect(JSON.stringify(stored)).not.toContain(data.secret.slice(-43));
	});

	it("refuses scopes the creator's role does not have (no privilege escalation)", async () => {
		await expect(
			create({
				scopes: [permissions.employees.create, permissions.serviceOrders.read],
			}).promise
		).rejects.toMatchObject({
			code: "api_key_invalid_scopes",
			status: 403,
			details: { invalidScopes: [permissions.employees.create] },
		});
		expect(mocks.ApiKeysRepository.createApiKey).not.toHaveBeenCalled();
	});

	it("refuses made-up scopes", async () => {
		await expect(
			create({ scopes: ["everything:*"] }).promise
		).rejects.toMatchObject({
			code: "api_key_invalid_scopes",
		});
	});

	it("caps the lifetime at API_KEY_MAX_TTL_DAYS", async () => {
		const tooFar = new Date(Date.now() + 366 * 86_400_000);
		const ok = new Date(Date.now() + 364 * 86_400_000);

		await expect(create({ expiresAt: tooFar }).promise).rejects.toMatchObject({
			code: "api_key_expiration_too_far",
		});
		await create({ expiresAt: ok }).promise;
		expect(mocks.ApiKeysRepository.createApiKey).toHaveBeenCalledWith(
			expect.objectContaining({ expiresAt: ok })
		);
	});

	it("rejects a duplicate active name for the same employee", async () => {
		mocks.ApiKeysRepository.getActiveByNameAndEmployee.mockResolvedValue({
			id: "x",
		});

		await expect(create({}).promise).rejects.toMatchObject({
			code: "api_key_name_conflict",
			status: 409,
		});
		expect(
			mocks.ApiKeysRepository.getActiveByNameAndEmployee
		).toHaveBeenCalledWith({
			name: "ERP",
			employeeId: employee.id,
		});
	});
});

describe("ApiKeysService.getOwnApiKeys", () => {
	it("lists only the caller's keys, without the hash", async () => {
		mocks.pagination.getPaginatedRecords.mockResolvedValue([{ id: "k" }]);
		mocks.pagination.getPaginatedCount.mockResolvedValue(1);
		const reply = createFakeReply();

		await ApiKeysService.getOwnApiKeys({
			userJwt: jwt(),
			subdomain: "fixr",
			page: 1,
			response: asReply(reply),
		});

		const [{ select }] = mocks.pagination.getPaginatedRecords.mock.calls[0]!;
		expect(Object.keys(select)).not.toContain("keyHash");
		expect(reply.state.body).toMatchObject({
			code: "get_api_keys_success",
			data: { pagination: { total_records: 1 } },
		});
	});

	it("returns an empty page and rejects a page past the end", async () => {
		mocks.pagination.getPaginatedRecords.mockResolvedValue([]);
		mocks.pagination.getPaginatedCount
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(2);
		const reply = createFakeReply();

		await ApiKeysService.getOwnApiKeys({
			userJwt: jwt(),
			subdomain: "fixr",
			page: 1,
			response: asReply(reply),
		});
		expect(reply.state.body).toMatchObject({ data: { records: [] } });

		await expect(
			ApiKeysService.getOwnApiKeys({
				userJwt: jwt(),
				subdomain: "fixr",
				page: 5,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});
});

describe("ApiKeysService.revokeApiKey", () => {
	const revoke = () =>
		ApiKeysService.revokeApiKey({
			userJwt: jwt(),
			subdomain: "fixr",
			apiKeyId: "k1",
			response: asReply(createFakeReply()),
		});

	it("revokes the caller's own key", async () => {
		mocks.ApiKeysRepository.getByIdAndEmployee.mockResolvedValue({
			id: "k1",
			revokedAt: null,
		});

		await revoke();

		expect(mocks.ApiKeysRepository.getByIdAndEmployee).toHaveBeenCalledWith({
			apiKeyId: "k1",
			employeeId: employee.id,
		});
		expect(mocks.ApiKeysRepository.revokeApiKey).toHaveBeenCalledWith("k1");
	});

	it("reports someone else's key as not found (no ID probing)", async () => {
		mocks.ApiKeysRepository.getByIdAndEmployee.mockResolvedValue(undefined);

		await expect(revoke()).rejects.toMatchObject({
			code: "api_key_not_found",
			status: 404,
		});
	});

	it("rejects revoking twice", async () => {
		mocks.ApiKeysRepository.getByIdAndEmployee.mockResolvedValue({
			id: "k1",
			revokedAt: new Date(),
		});

		await expect(revoke()).rejects.toMatchObject({
			code: "api_key_already_revoked",
		});
		expect(mocks.ApiKeysRepository.revokeApiKey).not.toHaveBeenCalled();
	});
});
