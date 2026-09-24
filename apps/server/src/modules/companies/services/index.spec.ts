import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const mocks = vi.hoisted(() => ({
	CompaniesRepository: {
		queryCompanyById: vi.fn(),
		queryCompanyBySubdomain: vi.fn(),
		queryEmployeeByCpf: vi.fn(),
		queryCompanyByCnpj: vi.fn(),
		queryUserByEmail: vi.fn(),
		createOrgWithAdmin: vi.fn(),
	},
	queueEmail: vi.fn(),
}));

vi.mock("../repositories", () => ({
	CompaniesRepository: mocks.CompaniesRepository,
}));
vi.mock("@fixr/mail/queue", () => ({
	createEmailQueue: vi.fn(() => "email-queue"),
	queueEmail: mocks.queueEmail,
}));
vi.mock("@fixr/mail/services", () => ({
	emailDisplayName: (email: string) => email.split("@")[0],
}));

const { CompaniesService } = await import(".");

const company = {
	id: createId(),
	name: "Fixr",
	cnpj: "11222333000181",
	address: null,
	subdomain: "fixr",
	createdAt: new Date(),
};

const jwt = (companyOverrides?: Record<string, unknown> | null) => ({
	id: createId(),
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	company:
		companyOverrides === null
			? undefined
			: {
					id: company.id,
					name: company.name,
					subdomain: company.subdomain,
					role: "admin" as const,
					...companyOverrides,
				},
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CompaniesService.getUserCompany", () => {
	it("reads the company from the JWT's company id", async () => {
		mocks.CompaniesRepository.queryCompanyById.mockResolvedValue(company);
		const reply = createFakeReply();

		await CompaniesService.getUserCompany({
			userJwt: jwt(),
			response: asReply(reply),
		});

		expect(mocks.CompaniesRepository.queryCompanyById).toHaveBeenCalledWith(
			company.id
		);
		expect(reply.state.body).toMatchObject({ data: { subdomain: "fixr" } });
	});

	it("fails for a user without company", async () => {
		await expect(
			CompaniesService.getUserCompany({
				userJwt: jwt(null),
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "company_not_found" });
	});
});

describe("CompaniesService.getCompanyBySubdomain", () => {
	it("returns the user's own company", async () => {
		mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(
			company
		);
		const reply = createFakeReply();

		await CompaniesService.getCompanyBySubdomain({
			subdomain: "fixr",
			userJwt: jwt(),
			response: asReply(reply),
		});

		expect(reply.state.statusCode).toBe(200);
	});

	it("never reads another company (tenant isolation)", async () => {
		await expect(
			CompaniesService.getCompanyBySubdomain({
				subdomain: "other",
				userJwt: jwt(),
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "not_allowed", status: 403 });
		expect(
			mocks.CompaniesRepository.queryCompanyBySubdomain
		).not.toHaveBeenCalled();
	});

	it("returns 404 when the company no longer exists", async () => {
		mocks.CompaniesRepository.queryCompanyBySubdomain.mockResolvedValue(null);

		await expect(
			CompaniesService.getCompanyBySubdomain({
				subdomain: "fixr",
				userJwt: jwt(),
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "company_not_found", status: 404 });
	});
});

describe("CompaniesService.createCompany", () => {
	const body = {
		name: "Nova",
		cnpj: "11.222.333/0001-81",
		subdomain: "Nova-SP",
		owner_cpf: "529.982.247-25",
		owner_email: "owner@fixr.test",
		owner_password: "Str0ng!Pass",
	};

	beforeEach(() => {
		for (const fn of [
			mocks.CompaniesRepository.queryEmployeeByCpf,
			mocks.CompaniesRepository.queryCompanyByCnpj,
			mocks.CompaniesRepository.queryUserByEmail,
			mocks.CompaniesRepository.queryCompanyBySubdomain,
		]) {
			fn.mockResolvedValue(null);
		}
	});

	it("normalizes subdomain/documents, creates the org and queues the invite", async () => {
		const reply = createFakeReply();

		await CompaniesService.createCompany({ body, response: asReply(reply) });

		expect(mocks.CompaniesRepository.createOrgWithAdmin).toHaveBeenCalledWith({
			...body,
			subdomain: "nova-sp",
			cnpj: "11222333000181",
			owner_cpf: "52998224725",
		});
		expect(mocks.queueEmail).toHaveBeenCalledWith("email-queue", {
			job: "sendInviteEmail",
			payload: expect.objectContaining({
				to: "owner@fixr.test",
				companyName: "Nova",
				password: "Str0ng!Pass",
			}),
		});
		expect(reply.state.statusCode).toBe(201);
	});

	it.each([
		["the owner CPF is taken", "queryEmployeeByCpf", "cpf_conflict"],
		["the CNPJ is taken", "queryCompanyByCnpj", "cnpj_conflict"],
		["the owner email is taken", "queryUserByEmail", "email_already_exists"],
		["the subdomain is taken", "queryCompanyBySubdomain", "subdomain_taken"],
	] as const)("rejects when %s", async (_label, method, code) => {
		mocks.CompaniesRepository[method].mockResolvedValue({ id: "x" });

		await expect(
			CompaniesService.createCompany({
				body,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code, status: 409 });
		expect(mocks.CompaniesRepository.createOrgWithAdmin).not.toHaveBeenCalled();
	});

	it("checks subdomain uniqueness against the normalized value", async () => {
		await CompaniesService.createCompany({
			body,
			response: asReply(createFakeReply()),
		});

		expect(
			mocks.CompaniesRepository.queryCompanyBySubdomain
		).toHaveBeenCalledWith("nova-sp");
	});
});
