import { unmask } from "@fixr/constants/masks";
import { and, db, eq } from "@fixr/db/connection";
import { employees, users } from "@fixr/db/schema";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { z } from "zod";
import { hashPassword } from "../../../core/lib/hash-password";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

/** @description Employees data access layer */
export class EmployeesRepository {
	/**
	 * Get an employee by CPF
	 *
	 * @param cpf - The employee CPF
	 * @returns The employee data or undefined
	 */
	@Cached({ ttl: 3600, key: "employees:cpf" })
	static async getEmployeeByCpf(cpf: string) {
		const [data] = await db
			.select()
			.from(employees)
			.where(eq(employees.cpf, cpf));
		return data;
	}

	/**
	 * Get an employee by the user account and company it belongs to
	 *
	 * @param userId - The user account ID
	 * @param companyId - The company ID
	 * @returns The employee data or undefined
	 */
	@Cached({ ttl: 3600, key: "employees:user-company" })
	static async getEmployeeByUserAndCompany({
		userId,
		companyId,
	}: {
		userId: string;
		companyId: string;
	}) {
		const [data] = await db
			.select()
			.from(employees)
			.where(
				and(eq(employees.userId, userId), eq(employees.companyId, companyId))
			)
			.limit(1);
		return data;
	}

	/**
	 * Create an employee and its associated user account
	 *
	 * @param data - The employee registration data
	 * @param companyId - The company ID
	 */
	@InvalidateCache({ patterns: ["employees:*"] })
	static async createEmployeeAndAccount({
		data,
		companyId,
	}: {
		data: z.infer<typeof createEmployeeSchema>;
		companyId: string;
	}) {
		const [userId] = await db
			.insert(users)
			.values({
				email: data.email,
				passwordHash: await hashPassword(data.password!),
				verified: true,
			})
			.$returningId();

		await db.insert(employees).values({
			cpf: data.cpf,
			name: data.name,
			phone: unmask.phone(data.phone),
			role: data.role,
			userId: userId.id,
			companyId,
		});
	}
}
