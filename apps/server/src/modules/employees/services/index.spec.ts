import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	AuthRepository: { queryUserByEmail: vi.fn() },
	CompaniesRepository: { queryCompanyBySubdomain: vi.fn() },
	EmployeesRepository: {
		getEmployeeByCpf: vi.fn(),
		createEmployeeAndAccount: vi.fn(),
	},
	getPaginatedRecords: vi.fn(),
	getPaginatedCount: vi.fn(),
	queueEmail: vi.fn(),
	generateRandomPassword: vi.fn(() => "Gen3rated!Pw"),
}));

vi.mock("../../auth/repositories", () => ({
	AuthRepository: mocks.AuthRepository,
}));
vi.mock("../../companies/repositories", () => ({
	CompaniesRepository: mocks.CompaniesRepository,
}));
vi.mock("../repositories", () => ({
	EmployeesRepository: mocks.EmployeesRepository,
}));
vi.mock("../../../core/lib/pagination", () => ({
	getPaginatedRecords: mocks.getPaginatedRecords,
	getPaginatedCount: mocks.getPaginatedCount,
}));
vi.mock("../../../core/lib/generate-password", () => ({
	generateRandomPassword: mocks.generateRandomPassword,
}));
vi.mock("@fixr/mail/queue", () => ({
	createEmailQueue: vi.fn(() => "email-queue"),
	queueEmail: mocks.queueEmail,
}));

const { EmployeesService } = await import(".");

const company = { id: createId(), name: "Fixr", subdomain: "fixr" };

const jwt = (role: string, companyOverrides: Record<string, unknown> = {}) => ({
	id: createId(),
	email: "me@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	company: { ...company, role, ...companyOverrides },
});

const noCompanyJwt = () => ({ ...jwt("admin"), company: undefined });

afterEach(() => {
	vi.clearAllMocks();
});

describe("EmployeesService.getCompanyEmployees", () => {
	beforeEach(() => {
		mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(
			company
		);
		mocks.getPaginatedRecords.mockResolvedValue([]);
		mocks.getPaginatedCount.mockResolvedValue(0);
	});

	const list = (userJwt: unknown, params: Record<string, unknown> = {}) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: EmployeesService.getCompanyEmployees({
				subdomain: "fixr",
				userJwt: userJwt as never,
				page: 1,
				response: asReply(reply),
				...params,
			}),
		};
	};

	it("rejects a user without company", async () => {
		await expect(list(noCompanyJwt()).promise).rejects.toMatchObject({
			code: "company_not_found",
		});
	});

	it("never lists another company's employees", async () => {
		await expect(
			list(jwt("admin"), { subdomain: "other" }).promise
		).rejects.toMatchObject({ code: "not_allowed", status: 403 });
		expect(mocks.getPaginatedRecords).not.toHaveBeenCalled();
	});

	it("returns an empty page when nothing matches", async () => {
		const { reply, promise } = list(jwt("admin"));
		await promise;

		expect(reply.state.body).toMatchObject({
			data: {
				records: [],
				pagination: { total_records: 0, total_pages: 0, current_page: 1 },
			},
		});
	});

	it("paginates with a default of 10 per page", async () => {
		mocks.getPaginatedRecords.mockResolvedValue(
			new Array(10).fill({ id: "e" })
		);
		mocks.getPaginatedCount.mockResolvedValue(25);

		const { reply, promise } = list(jwt("admin"), { page: 2 });
		await promise;

		expect(mocks.getPaginatedRecords).toHaveBeenCalledWith(
			expect.objectContaining({ skip: 10, take: 10 })
		);
		expect(reply.state.body).toMatchObject({
			data: {
				pagination: {
					total_records: 25,
					total_pages: 3,
					current_page: 2,
					next_page: 3,
					prev_page: 1,
				},
			},
		});
	});

	it("has no next page on the last page", async () => {
		mocks.getPaginatedRecords.mockResolvedValue(new Array(5).fill({ id: "e" }));
		mocks.getPaginatedCount.mockResolvedValue(25);

		const { reply, promise } = list(jwt("admin"), { page: 3 });
		await promise;

		expect(reply.state.body).toMatchObject({
			data: { pagination: { next_page: null, prev_page: 2 } },
		});
	});

	it("rejects a page past the end", async () => {
		mocks.getPaginatedCount.mockResolvedValue(5);

		await expect(list(jwt("admin"), { page: 2 }).promise).rejects.toMatchObject(
			{
				code: "page_out_of_bounds",
				status: 416,
			}
		);
	});
});

describe("EmployeesService.registerEmployee", () => {
	const data = {
		name: "Novo Técnico",
		cpf: "52998224725",
		role: "technician" as const,
		email: "novo@fixr.test",
		phone: null,
	};

	beforeEach(() => {
		mocks.AuthRepository.queryUserByEmail.mockResolvedValue(null);
		mocks.EmployeesRepository.getEmployeeByCpf.mockResolvedValue(null);
		mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(
			company
		);
	});

	const register = (
		userJwt: unknown,
		overrides: Record<string, unknown> = {},
		subdomain = "fixr"
	) =>
		EmployeesService.registerEmployee({
			userJwt: userJwt as never,
			subdomain,
			data: { ...data, ...overrides } as never,
			response: asReply(createFakeReply()),
		});

	it.each([
		"admin",
		"manager",
	])("lets a %s register an employee", async (role) => {
		await register(jwt(role));

		expect(
			mocks.EmployeesRepository.createEmployeeAndAccount
		).toHaveBeenCalledWith({
			data: { ...data, password: "Gen3rated!Pw" },
			companyId: company.id,
		});
	});

	it("generates a password when none is given and sends it in the invite", async () => {
		await register(jwt("admin"));

		expect(mocks.queueEmail).toHaveBeenCalledWith("email-queue", {
			job: "sendInviteEmail",
			payload: expect.objectContaining({
				to: "novo@fixr.test",
				password: "Gen3rated!Pw",
				companyName: "Fixr",
			}),
		});
	});

	it("keeps an explicitly given password", async () => {
		await register(jwt("admin"), { password: "Given!Pw1" });

		expect(mocks.generateRandomPassword).not.toHaveBeenCalled();
	});

	it.each([
		"technician",
		"warehouse",
		"financial",
		"guest",
	])("rejects a %s", async (role) => {
		await expect(register(jwt(role))).rejects.toMatchObject({
			code: "not_allowed",
		});
		expect(
			mocks.EmployeesRepository.createEmployeeAndAccount
		).not.toHaveBeenCalled();
	});

	it("never creates employees in another company", async () => {
		await expect(register(jwt("admin"), {}, "other")).rejects.toMatchObject({
			code: "not_allowed",
		});
	});

	it("rejects a user without company", async () => {
		await expect(register(noCompanyJwt())).rejects.toMatchObject({
			code: "company_not_found",
		});
	});

	it("does not let a manager create an admin (privilege escalation)", async () => {
		await expect(
			register(jwt("manager"), { role: "admin" })
		).rejects.toMatchObject({
			code: "violates_role_hierarchy",
			status: 403,
		});
	});

	it("lets an admin create another admin", async () => {
		await register(jwt("admin"), { role: "admin" });

		expect(
			mocks.EmployeesRepository.createEmployeeAndAccount
		).toHaveBeenCalled();
	});

	it.each([
		[
			"the email is taken",
			"AuthRepository",
			"queryUserByEmail",
			"email_already_used",
		],
		[
			"the CPF is taken",
			"EmployeesRepository",
			"getEmployeeByCpf",
			"cpf_conflict",
		],
	] as const)("rejects when %s", async (_label, repo, method, code) => {
		(mocks[repo] as any)[method].mockResolvedValue({ id: "x" });

		await expect(register(jwt("admin"))).rejects.toMatchObject({
			code,
			status: 409,
		});
	});

	it("fails when the company no longer exists", async () => {
		mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(null);

		await expect(register(jwt("admin"))).rejects.toMatchObject({
			code: "company_not_found",
		});
	});
});
