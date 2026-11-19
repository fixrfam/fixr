import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		countMembers: vi.fn(async () => new Map([["d1", 3]])),
		queryDepartmentOfCompany: vi.fn(),
		queryMembers: vi.fn(async () => []),
		queryDepartmentByName: vi.fn(),
		insertDepartment: vi.fn(async () => "d1"),
		updateDepartment: vi.fn(),
		deleteDepartment: vi.fn(),
		countEmployeesOfCompany: vi.fn(),
		countDepartmentsOfCompany: vi.fn(),
		isMember: vi.fn(),
		addMembers: vi.fn(),
		removeMember: vi.fn(),
		queryEmployeesDepartments: vi.fn(async () => new Map()),
		replaceEmployeeDepartments: vi.fn(),
		queryEmployeeOfCompany: vi.fn(),
		queryStageOwners: vi.fn(async () => []),
		replaceStageOwners: vi.fn(),
	},
	pagination: {
		getPaginatedRecords: vi.fn(),
		getPaginatedCount: vi.fn(),
		paginationMeta: vi.fn(),
	},
}));

vi.mock("../repositories", () => ({
	DepartmentsRepository: repo,
	departmentsListSelect: {},
	departmentsListJoins: [],
}));
vi.mock("../../../core/lib/pagination", () => pagination);
vi.mock("../../../core/lib/transaction", () => ({
	inTransaction: (work: (tx: unknown) => unknown) => work("TX"),
}));

const { DepartmentsService } = await import(".");

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
} as never;

function call<T>(fn: (params: T) => Promise<unknown>, params: object) {
	const reply = createFakeReply();
	return {
		reply,
		promise: fn({
			userJwt,
			subdomain: "fixr",
			response: asReply(reply),
			...params,
		} as T),
	};
}

beforeEach(() => {
	repo.queryDepartmentOfCompany.mockResolvedValue({ id: "d1", companyId });
	repo.queryDepartmentByName.mockResolvedValue(null);
	repo.queryEmployeeOfCompany.mockResolvedValue({ id: "e1" });
	repo.isMember.mockResolvedValue(true);
	repo.countDepartmentsOfCompany.mockResolvedValue(1);
	repo.countEmployeesOfCompany.mockResolvedValue(1);
	pagination.getPaginatedRecords.mockResolvedValue([{ id: "d1" }]);
	pagination.getPaginatedCount.mockResolvedValue(1);
	pagination.paginationMeta.mockReturnValue({ total_records: 1 });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("DepartmentsService company scope", () => {
	it("rejects a user without company", async () => {
		await expect(
			DepartmentsService.listStageOwners({
				userJwt: { ...(userJwt as object), company: undefined } as never,
				subdomain: "fixr",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "company_not_found" });
	});

	it("never serves another company's subdomain", async () => {
		await expect(
			DepartmentsService.listStageOwners({
				userJwt,
				subdomain: "other",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "not_allowed" });
	});
});

describe("DepartmentsService list and detail", () => {
	it("lists the company's departments with how many members each has", async () => {
		const { reply, promise } = call(DepartmentsService.listDepartments, {
			page: 1,
			query: "banc",
		});
		await promise;

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, "banc");
		expect(reply.state.body).toMatchObject({
			data: { records: [{ id: "d1", membersCount: 3 }] },
		});
	});

	it("reports a page past the end", async () => {
		pagination.paginationMeta.mockReturnValue(null);
		await expect(
			call(DepartmentsService.listDepartments, { page: 9 }).promise
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});

	it("returns a department with its members", async () => {
		repo.queryMembers.mockResolvedValue([{ id: "e1" }] as never);
		const { reply, promise } = call(DepartmentsService.getDepartment, {
			departmentId: "d1",
		});
		await promise;
		expect(reply.state.body).toMatchObject({
			data: { id: "d1", members: [{ id: "e1" }] },
		});
	});

	it("never shows another company's department", async () => {
		repo.queryDepartmentOfCompany.mockResolvedValue(null);
		await expect(
			call(DepartmentsService.getDepartment, { departmentId: "d1" }).promise
		).rejects.toMatchObject({ code: "department_not_found" });
	});
});

describe("DepartmentsService changes", () => {
	it("creates a department with a free name", async () => {
		const { reply, promise } = call(DepartmentsService.createDepartment, {
			data: { name: "Bancada" },
		});
		await promise;
		expect(repo.insertDepartment).toHaveBeenCalledWith({
			companyId,
			name: "Bancada",
		});
		expect(reply.state.statusCode).toBe(201);
	});

	it("refuses a name another department already uses", async () => {
		repo.queryDepartmentByName.mockResolvedValue({ id: "other" });
		await expect(
			call(DepartmentsService.createDepartment, { data: { name: "Bancada" } })
				.promise
		).rejects.toMatchObject({ code: "department_name_conflict" });
	});

	it("renames it and sets a member as leader", async () => {
		repo.queryDepartmentByName.mockResolvedValue({ id: "d1" });
		await call(DepartmentsService.patchDepartment, {
			departmentId: "d1",
			data: { name: "Bancada", leaderId: "e1" },
		}).promise;
		expect(repo.isMember).toHaveBeenCalledWith("d1", "e1");
		expect(repo.updateDepartment).toHaveBeenCalledWith("d1", {
			name: "Bancada",
			leaderId: "e1",
		});
	});

	it("refuses a leader who isn't a member", async () => {
		repo.isMember.mockResolvedValue(false);
		await expect(
			call(DepartmentsService.patchDepartment, {
				departmentId: "d1",
				data: { leaderId: "e9" },
			}).promise
		).rejects.toMatchObject({ code: "department_leader_not_member" });
		expect(repo.updateDepartment).not.toHaveBeenCalled();
	});

	it("skips the update when nothing changed", async () => {
		await call(DepartmentsService.patchDepartment, {
			departmentId: "d1",
			data: {},
		}).promise;
		expect(repo.updateDepartment).not.toHaveBeenCalled();
	});

	it("deletes a department of the company", async () => {
		await call(DepartmentsService.deleteDepartment, { departmentId: "d1" })
			.promise;
		expect(repo.deleteDepartment).toHaveBeenCalledWith("d1");
	});
});

describe("DepartmentsService members", () => {
	it("adds employees of the company, once each", async () => {
		await call(DepartmentsService.addMembers, {
			departmentId: "d1",
			data: { employeeIds: ["e1", "e1"] },
		}).promise;
		expect(repo.addMembers).toHaveBeenCalledWith("d1", ["e1"]);
	});

	it("refuses an employee of another company", async () => {
		repo.countEmployeesOfCompany.mockResolvedValue(0);
		await expect(
			call(DepartmentsService.addMembers, {
				departmentId: "d1",
				data: { employeeIds: ["e9"] },
			}).promise
		).rejects.toMatchObject({ code: "department_employee_not_found" });
	});

	it("removes a member", async () => {
		await call(DepartmentsService.removeMember, {
			departmentId: "d1",
			employeeId: "e1",
		}).promise;
		expect(repo.removeMember).toHaveBeenCalledWith("d1", "e1");
	});

	it("sets every department of an employee", async () => {
		repo.queryEmployeesDepartments.mockResolvedValue(
			new Map([["e1", [{ id: "d1", name: "Bancada" }]]])
		);
		const { reply, promise } = call(DepartmentsService.putEmployeeDepartments, {
			employeeId: "e1",
			data: { departmentIds: ["d1"] },
		});
		await promise;
		expect(repo.replaceEmployeeDepartments).toHaveBeenCalledWith("e1", ["d1"]);
		expect(reply.state.body).toMatchObject({
			data: [{ id: "d1", name: "Bancada" }],
		});
	});

	it.each([
		[
			"an employee",
			"queryEmployeeOfCompany",
			null,
			"department_employee_not_found",
		],
		["a department", "countDepartmentsOfCompany", 0, "department_not_found"],
	] as const)("refuses %s of another company", async (_, query, value, code) => {
		repo[query].mockResolvedValue(value as never);
		await expect(
			call(DepartmentsService.putEmployeeDepartments, {
				employeeId: "e1",
				data: { departmentIds: ["d1"] },
			}).promise
		).rejects.toMatchObject({ code });
	});
});

describe("DepartmentsService stage owners", () => {
	const stages = [
		{
			status: "pending",
			departmentId: "d1",
			assigneeMode: "pool",
			employeeId: null,
		},
		{
			status: "fixing",
			departmentId: "d1",
			assigneeMode: "employee",
			employeeId: "e1",
		},
	];

	it("lists the stage owners", async () => {
		const { reply, promise } = call(DepartmentsService.listStageOwners, {});
		await promise;
		expect(repo.queryStageOwners).toHaveBeenCalledWith(companyId);
		expect(reply.state.statusCode).toBe(200);
	});

	it("replaces the owners when the departments and employees check out", async () => {
		await call(DepartmentsService.putStageOwners, { data: { stages } }).promise;

		expect(repo.countDepartmentsOfCompany).toHaveBeenCalledWith(
			["d1"],
			companyId
		);
		expect(repo.isMember).toHaveBeenCalledWith("d1", "e1");
		expect(repo.replaceStageOwners).toHaveBeenCalledWith(
			"TX",
			companyId,
			stages
		);
	});

	it.each([
		["a department of another company", "countDepartmentsOfCompany", 0],
		["an employee outside the department", "isMember", false],
	] as const)("refuses %s", async (_, query, value) => {
		repo[query].mockResolvedValue(value as never);
		await expect(
			call(DepartmentsService.putStageOwners, { data: { stages } }).promise
		).rejects.toMatchObject({ code: "department_stage_owner_invalid" });
		expect(repo.replaceStageOwners).not.toHaveBeenCalled();
	});
});
