import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo } = vi.hoisted(() => ({
	repo: {
		querySectorsWithEmployees: vi.fn(async () => [{ id: "s1" }]),
		querySectorOfCompany: vi.fn(),
		querySectorByName: vi.fn(),
		insertSector: vi.fn(),
		updateSector: vi.fn(),
		deleteSector: vi.fn(),
		queryEmployeeOfCompany: vi.fn(),
		updateEmployeeSector: vi.fn(),
		countSectorsOfCompany: vi.fn(),
		countEmployeesOfCompany: vi.fn(),
		queryStageOwners: vi.fn(async () => []),
		replaceStageOwners: vi.fn(),
	},
}));

vi.mock("../repositories", () => ({ SectorsRepository: repo }));
vi.mock("../../../core/lib/transaction", () => ({
	inTransaction: (work: (tx: unknown) => unknown) => work("TX"),
}));

const { SectorsService } = await import(".");

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
	repo.querySectorOfCompany.mockResolvedValue({ id: "s1", companyId });
	repo.querySectorByName.mockResolvedValue(null);
	repo.queryEmployeeOfCompany.mockResolvedValue({ id: "e1", sectorId: null });
	repo.countSectorsOfCompany.mockResolvedValue(0);
	repo.countEmployeesOfCompany.mockResolvedValue(0);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("SectorsService company scope", () => {
	it("rejects a user without company", async () => {
		const reply = createFakeReply();
		// listSectors throws synchronously; the route handler is async either way.
		await expect(
			Promise.resolve().then(() =>
				SectorsService.listSectors({
					userJwt: { ...(userJwt as object), company: undefined } as never,
					subdomain: "fixr",
					response: asReply(reply),
				})
			)
		).rejects.toMatchObject({ code: "company_not_found" });
	});

	it("never serves another company's subdomain", async () => {
		const reply = createFakeReply();
		await expect(
			Promise.resolve().then(() =>
				SectorsService.listSectors({
					userJwt,
					subdomain: "other",
					response: asReply(reply),
				})
			)
		).rejects.toMatchObject({ code: "not_allowed" });
	});

	it("lists the company's sectors", async () => {
		const { reply, promise } = call(SectorsService.listSectors, {});
		await promise;
		expect(repo.querySectorsWithEmployees).toHaveBeenCalledWith(companyId);
		expect(reply.state.body).toMatchObject({ data: [{ id: "s1" }] });
	});
});

describe("SectorsService sectors", () => {
	it("creates a sector with a free name", async () => {
		const { reply, promise } = call(SectorsService.createSector, {
			data: { name: "Bancada" },
		});
		await promise;
		expect(repo.insertSector).toHaveBeenCalledWith({
			companyId,
			name: "Bancada",
		});
		expect(reply.state.statusCode).toBe(201);
	});

	it("refuses a name another sector already uses", async () => {
		repo.querySectorByName.mockResolvedValue({ id: "other" });
		await expect(
			call(SectorsService.createSector, { data: { name: "Bancada" } }).promise
		).rejects.toMatchObject({ code: "sector_name_conflict" });
		expect(repo.insertSector).not.toHaveBeenCalled();
	});

	it("renames a sector, keeping its own name allowed", async () => {
		repo.querySectorByName.mockResolvedValue({ id: "s1" });
		await call(SectorsService.renameSector, {
			sectorId: "s1",
			data: { name: "Bancada" },
		}).promise;
		expect(repo.updateSector).toHaveBeenCalledWith("s1", "Bancada");
	});

	it.each([
		["renames", "renameSector", { data: { name: "X" } }],
		["deletes", "deleteSector", {}],
	] as const)("never %s another company's sector", async (_, method, extra) => {
		repo.querySectorOfCompany.mockResolvedValue(null);
		await expect(
			call(SectorsService[method] as never, { sectorId: "s1", ...extra })
				.promise
		).rejects.toMatchObject({ code: "sector_not_found" });
	});

	it("deletes a sector of the company", async () => {
		await call(SectorsService.deleteSector, { sectorId: "s1" }).promise;
		expect(repo.deleteSector).toHaveBeenCalledWith("s1");
	});
});

describe("SectorsService employees", () => {
	it("moves an employee to a sector of the company", async () => {
		await call(SectorsService.setEmployeeSector, {
			employeeId: "e1",
			data: { sectorId: "s1" },
		}).promise;
		expect(repo.updateEmployeeSector).toHaveBeenCalledWith("e1", "s1");
	});

	it("takes an employee out of every sector", async () => {
		await call(SectorsService.setEmployeeSector, {
			employeeId: "e1",
			data: { sectorId: null },
		}).promise;
		expect(repo.querySectorOfCompany).not.toHaveBeenCalled();
		expect(repo.updateEmployeeSector).toHaveBeenCalledWith("e1", null);
	});

	it("refuses an employee of another company", async () => {
		repo.queryEmployeeOfCompany.mockResolvedValue(null);
		await expect(
			call(SectorsService.setEmployeeSector, {
				employeeId: "e1",
				data: { sectorId: null },
			}).promise
		).rejects.toMatchObject({ code: "sector_employee_not_found" });
	});
});

describe("SectorsService stage owners", () => {
	it("lists the stage owners", async () => {
		const { reply, promise } = call(SectorsService.listStageOwners, {});
		await promise;
		expect(repo.queryStageOwners).toHaveBeenCalledWith(companyId);
		expect(reply.state.statusCode).toBe(200);
	});

	it("replaces the owners when every sector and employee is the company's", async () => {
		repo.countSectorsOfCompany.mockResolvedValue(1);
		repo.countEmployeesOfCompany.mockResolvedValue(1);
		const stages = [
			{ status: "pending", sectorId: "s1", employeeId: null },
			{ status: "fixing", sectorId: "s1", employeeId: "e1" },
		];

		await call(SectorsService.putStageOwners, { data: { stages } }).promise;

		expect(repo.countSectorsOfCompany).toHaveBeenCalledWith(["s1"], companyId);
		expect(repo.countEmployeesOfCompany).toHaveBeenCalledWith(
			["e1"],
			companyId
		);
		expect(repo.replaceStageOwners).toHaveBeenCalledWith(
			"TX",
			companyId,
			stages
		);
	});

	it("refuses a sector or employee of another company", async () => {
		await expect(
			call(SectorsService.putStageOwners, {
				data: {
					stages: [{ status: "pending", sectorId: "s9", employeeId: null }],
				},
			}).promise
		).rejects.toMatchObject({ code: "sector_stage_owner_invalid" });
		expect(repo.replaceStageOwners).not.toHaveBeenCalled();
	});
});
