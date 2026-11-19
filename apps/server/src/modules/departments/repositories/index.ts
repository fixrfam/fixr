import {
	alias,
	and,
	asc,
	count,
	db,
	desc,
	eq,
	inArray,
	like,
	type SQL,
	type Transaction,
} from "@fixr/db/connection";
import {
	departmentMembers,
	departments,
	employees,
	serviceOrderStageOwners,
} from "@fixr/db/schema";
import type { stageAssigneeModes } from "@fixr/schemas/departments";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { InvalidateCache } from "../../../shared/infra/cache";

type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;

const leaders = alias(employees, "leaders");

/** Columns of a department in lists: its leader and how many members it has. */
export const departmentsListSelect = {
	id: departments.id,
	companyId: departments.companyId,
	name: departments.name,
	leaderId: departments.leaderId,
	createdAt: departments.createdAt,
	updatedAt: departments.updatedAt,
	leader: { id: leaders.id, name: leaders.name, cpf: leaders.cpf },
};

export const departmentsListJoins = [
	{
		type: "left" as const,
		table: leaders,
		on: eq(leaders.id, departments.leaderId),
	},
];

/** @description Data access layer for departments, their members and the default owner of each stage */
export class DepartmentsRepository {
	static buildListFilter(companyId: string, query?: string) {
		const conditions: SQL[] = [eq(departments.companyId, companyId)];
		if (query) {
			conditions.push(like(departments.name, `%${query}%`));
		}
		return and(...conditions);
	}

	static buildOrder(sort?: "name" | "newer" | "older") {
		if (sort === "newer") {
			return desc(departments.createdAt);
		}
		if (sort === "older") {
			return asc(departments.createdAt);
		}
		return asc(departments.name);
	}

	/** How many members each of the departments has. */
	static async countMembers(departmentIds: string[]) {
		if (departmentIds.length === 0) {
			return new Map<string, number>();
		}
		const rows = await db
			.select({ departmentId: departmentMembers.departmentId, total: count() })
			.from(departmentMembers)
			.where(inArray(departmentMembers.departmentId, departmentIds))
			.groupBy(departmentMembers.departmentId);
		return new Map(rows.map((row) => [row.departmentId, row.total]));
	}

	static async queryDepartmentOfCompany(
		departmentId: string,
		companyId: string
	) {
		const [department] = await db
			.select(departmentsListSelect)
			.from(departments)
			.leftJoin(leaders, eq(leaders.id, departments.leaderId))
			.where(
				and(
					eq(departments.id, departmentId),
					eq(departments.companyId, companyId)
				)
			)
			.limit(1);
		return department ?? null;
	}

	/** The department's members, by name. */
	static async queryMembers(departmentId: string) {
		return await db
			.select({
				id: employees.id,
				name: employees.name,
				cpf: employees.cpf,
				role: employees.role,
				addedAt: departmentMembers.createdAt,
			})
			.from(departmentMembers)
			.innerJoin(employees, eq(employees.id, departmentMembers.employeeId))
			.where(eq(departmentMembers.departmentId, departmentId))
			.orderBy(asc(employees.name));
	}

	static async queryDepartmentByName(companyId: string, name: string) {
		const [department] = await db
			.select({ id: departments.id })
			.from(departments)
			.where(
				and(eq(departments.companyId, companyId), eq(departments.name, name))
			)
			.limit(1);
		return department ?? null;
	}

	static async insertDepartment(values: typeof departments.$inferInsert) {
		const [inserted] = await db
			.insert(departments)
			.values(values)
			.$returningId();
		return inserted.id;
	}

	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async updateDepartment(
		departmentId: string,
		values: Partial<Pick<typeof departments.$inferInsert, "name" | "leaderId">>
	) {
		await db
			.update(departments)
			.set(values)
			.where(eq(departments.id, departmentId));
	}

	/** Its members, its stages and the orders in its pool go with it (or lose it). */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async deleteDepartment(departmentId: string) {
		await db.delete(departments).where(eq(departments.id, departmentId));
	}

	/** How many of the ids are employees of the company. */
	static async countEmployeesOfCompany(ids: string[], companyId: string) {
		if (ids.length === 0) {
			return 0;
		}
		const [row] = await db
			.select({ total: count() })
			.from(employees)
			.where(
				and(inArray(employees.id, ids), eq(employees.companyId, companyId))
			);
		return row?.total ?? 0;
	}

	/** How many of the ids are departments of the company. */
	static async countDepartmentsOfCompany(ids: string[], companyId: string) {
		if (ids.length === 0) {
			return 0;
		}
		const [row] = await db
			.select({ total: count() })
			.from(departments)
			.where(
				and(inArray(departments.id, ids), eq(departments.companyId, companyId))
			);
		return row?.total ?? 0;
	}

	static async isMember(
		departmentId: string,
		employeeId: string,
		executor: Transaction | typeof db = db
	) {
		const [row] = await executor
			.select({ employeeId: departmentMembers.employeeId })
			.from(departmentMembers)
			.where(
				and(
					eq(departmentMembers.departmentId, departmentId),
					eq(departmentMembers.employeeId, employeeId)
				)
			)
			.limit(1);
		return Boolean(row);
	}

	/** Add employees to a department; those already in it stay as they are. */
	static async addMembers(departmentId: string, employeeIds: string[]) {
		await db
			.insert(departmentMembers)
			.values(employeeIds.map((employeeId) => ({ departmentId, employeeId })))
			.onDuplicateKeyUpdate({
				set: { departmentId },
			});
	}

	/** Take an employee out of a department, and out of its lead if they had it. */
	static async removeMember(departmentId: string, employeeId: string) {
		await db.transaction(async (tx) => {
			await tx
				.delete(departmentMembers)
				.where(
					and(
						eq(departmentMembers.departmentId, departmentId),
						eq(departmentMembers.employeeId, employeeId)
					)
				);
			await tx
				.update(departments)
				.set({ leaderId: null })
				.where(
					and(
						eq(departments.id, departmentId),
						eq(departments.leaderId, employeeId)
					)
				);
		});
	}

	/** The departments of each employee, by name. */
	static async queryEmployeesDepartments(employeeIds: string[]) {
		if (employeeIds.length === 0) {
			return new Map<string, { id: string; name: string }[]>();
		}
		const rows = await db
			.select({
				employeeId: departmentMembers.employeeId,
				id: departments.id,
				name: departments.name,
			})
			.from(departmentMembers)
			.innerJoin(
				departments,
				eq(departments.id, departmentMembers.departmentId)
			)
			.where(inArray(departmentMembers.employeeId, employeeIds))
			.orderBy(asc(departments.name));
		const byEmployee = new Map<string, { id: string; name: string }[]>();
		for (const { employeeId, id, name } of rows) {
			byEmployee.set(employeeId, [
				...(byEmployee.get(employeeId) ?? []),
				{ id, name },
			]);
		}
		return byEmployee;
	}

	/**
	 * Make `departmentIds` the employee's departments: the others drop them
	 * (and their lead), the new ones gain them.
	 */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async replaceEmployeeDepartments(
		employeeId: string,
		departmentIds: string[]
	) {
		await db.transaction(async (tx) => {
			await tx
				.delete(departmentMembers)
				.where(eq(departmentMembers.employeeId, employeeId));
			await tx
				.update(departments)
				.set({ leaderId: null })
				.where(eq(departments.leaderId, employeeId));
			if (departmentIds.length > 0) {
				await tx
					.insert(departmentMembers)
					.values(
						departmentIds.map((departmentId) => ({ departmentId, employeeId }))
					);
			}
		});
	}

	static async queryEmployeeOfCompany(employeeId: string, companyId: string) {
		const [employee] = await db
			.select({ id: employees.id })
			.from(employees)
			.where(
				and(eq(employees.id, employeeId), eq(employees.companyId, companyId))
			)
			.limit(1);
		return employee ?? null;
	}

	static async queryStageOwners(companyId: string) {
		return await db
			.select({
				status: serviceOrderStageOwners.status,
				departmentId: serviceOrderStageOwners.departmentId,
				assigneeMode: serviceOrderStageOwners.assigneeMode,
				employeeId: serviceOrderStageOwners.employeeId,
			})
			.from(serviceOrderStageOwners)
			.where(eq(serviceOrderStageOwners.companyId, companyId));
	}

	/** The default owner of one stage, with the department's leader, read in the transaction that moved the order. */
	static async queryStageOwner(
		tx: Transaction,
		companyId: string,
		status: ServiceOrderStatus
	) {
		const [owner] = await tx
			.select({
				departmentId: serviceOrderStageOwners.departmentId,
				assigneeMode: serviceOrderStageOwners.assigneeMode,
				employeeId: serviceOrderStageOwners.employeeId,
				leaderId: departments.leaderId,
			})
			.from(serviceOrderStageOwners)
			.innerJoin(
				departments,
				eq(departments.id, serviceOrderStageOwners.departmentId)
			)
			.where(
				and(
					eq(serviceOrderStageOwners.companyId, companyId),
					eq(serviceOrderStageOwners.status, status)
				)
			)
			.limit(1);
		return owner ?? null;
	}

	/** Replace every stage's default owner of the company. */
	static async replaceStageOwners(
		tx: Transaction,
		companyId: string,
		stages: {
			status: ServiceOrderStatus;
			departmentId: string;
			assigneeMode: z.infer<typeof stageAssigneeModes>;
			employeeId: string | null;
		}[]
	) {
		await tx
			.delete(serviceOrderStageOwners)
			.where(eq(serviceOrderStageOwners.companyId, companyId));
		if (stages.length > 0) {
			await tx.insert(serviceOrderStageOwners).values(
				stages.map((stage) => ({
					...stage,
					// Only the "employee" mode names someone.
					employeeId:
						stage.assigneeMode === "employee" ? stage.employeeId : null,
					companyId,
				}))
			);
		}
	}
}
