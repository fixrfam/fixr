import {
	and,
	asc,
	db,
	eq,
	inArray,
	type Transaction,
} from "@fixr/db/connection";
import { employees, sectors, serviceOrderStageOwners } from "@fixr/db/schema";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;

/** @description Data access layer for sectors and the default owner of each stage */
export class SectorsRepository {
	/** The company's sectors, by name, with their employees. */
	@Cached({ ttl: 3600, key: "sectors:company" })
	static async querySectorsWithEmployees(companyId: string) {
		const [rows, members] = await Promise.all([
			db
				.select()
				.from(sectors)
				.where(eq(sectors.companyId, companyId))
				.orderBy(asc(sectors.name)),
			db
				.select({
					id: employees.id,
					name: employees.name,
					sectorId: employees.sectorId,
				})
				.from(employees)
				.where(eq(employees.companyId, companyId))
				.orderBy(asc(employees.name)),
		]);
		return rows.map((sector) => ({
			...sector,
			employees: members
				.filter((member) => member.sectorId === sector.id)
				.map(({ id, name }) => ({ id, name })),
		}));
	}

	static async querySectorOfCompany(sectorId: string, companyId: string) {
		const [sector] = await db
			.select()
			.from(sectors)
			.where(and(eq(sectors.id, sectorId), eq(sectors.companyId, companyId)))
			.limit(1);
		return sector ?? null;
	}

	static async querySectorByName(companyId: string, name: string) {
		const [sector] = await db
			.select({ id: sectors.id })
			.from(sectors)
			.where(and(eq(sectors.companyId, companyId), eq(sectors.name, name)))
			.limit(1);
		return sector ?? null;
	}

	@InvalidateCache({ patterns: ["sectors:*"] })
	static async insertSector(values: typeof sectors.$inferInsert) {
		const [inserted] = await db.insert(sectors).values(values).$returningId();
		return inserted.id;
	}

	@InvalidateCache({ patterns: ["sectors:*", "service-orders:*"] })
	static async updateSector(sectorId: string, name: string) {
		await db.update(sectors).set({ name }).where(eq(sectors.id, sectorId));
	}

	/** Its employees, orders and stages are left without a sector (`set null`). */
	@InvalidateCache({ patterns: ["sectors:*", "service-orders:*"] })
	static async deleteSector(sectorId: string) {
		await db.delete(sectors).where(eq(sectors.id, sectorId));
	}

	static async queryEmployeeOfCompany(
		employeeId: string,
		companyId: string,
		executor: Transaction | typeof db = db
	) {
		const [employee] = await executor
			.select({ id: employees.id, sectorId: employees.sectorId })
			.from(employees)
			.where(
				and(eq(employees.id, employeeId), eq(employees.companyId, companyId))
			)
			.limit(1);
		return employee ?? null;
	}

	/** How many of the ids are employees of the company. */
	static async countEmployeesOfCompany(ids: string[], companyId: string) {
		if (ids.length === 0) {
			return 0;
		}
		const rows = await db
			.select({ id: employees.id })
			.from(employees)
			.where(
				and(inArray(employees.id, ids), eq(employees.companyId, companyId))
			);
		return rows.length;
	}

	/** How many of the ids are sectors of the company. */
	static async countSectorsOfCompany(ids: string[], companyId: string) {
		if (ids.length === 0) {
			return 0;
		}
		const rows = await db
			.select({ id: sectors.id })
			.from(sectors)
			.where(and(inArray(sectors.id, ids), eq(sectors.companyId, companyId)));
		return rows.length;
	}

	// The service orders module caches the caller's employee record (with its sector).
	@InvalidateCache({ patterns: ["sectors:*", "service-orders:*"] })
	static async updateEmployeeSector(
		employeeId: string,
		sectorId: string | null
	) {
		await db
			.update(employees)
			.set({ sectorId })
			.where(eq(employees.id, employeeId));
	}

	static async queryStageOwners(companyId: string) {
		return await db
			.select({
				status: serviceOrderStageOwners.status,
				sectorId: serviceOrderStageOwners.sectorId,
				employeeId: serviceOrderStageOwners.employeeId,
			})
			.from(serviceOrderStageOwners)
			.where(eq(serviceOrderStageOwners.companyId, companyId));
	}

	/** The default owner of one stage, read in the transaction that moved the order. */
	static async queryStageOwner(
		tx: Transaction,
		companyId: string,
		status: ServiceOrderStatus
	) {
		const [owner] = await tx
			.select({
				sectorId: serviceOrderStageOwners.sectorId,
				employeeId: serviceOrderStageOwners.employeeId,
			})
			.from(serviceOrderStageOwners)
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
			sectorId: string | null;
			employeeId: string | null;
		}[]
	) {
		await tx
			.delete(serviceOrderStageOwners)
			.where(eq(serviceOrderStageOwners.companyId, companyId));
		const owned = stages.filter((stage) => stage.sectorId || stage.employeeId);
		if (owned.length > 0) {
			await tx
				.insert(serviceOrderStageOwners)
				.values(owned.map((stage) => ({ ...stage, companyId })));
		}
	}
}
