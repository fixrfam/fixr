import { unmask } from "@fixr/constants/masks";
import { db, eq } from "@fixr/db/connection";
import { employees, users } from "@fixr/db/schema";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { z } from "zod";
import { hashPassword } from "../../../core/lib/hash-password";

/** @description Employees data access layer */
export class EmployeesRepository {
	/**
	 * Get an employee by CPF
	 *
	 * @param cpf - The employee CPF
	 * @returns The employee data or undefined
	 */
	static async getEmployeeByCpf(cpf: string) {
		const [data] = await db
			.select()
			.from(employees)
			.where(eq(employees.cpf, cpf));
		return data;
	}

	/**
	 * Create an employee and its associated user account
	 *
	 * @param data - The employee registration data
	 * @param companyId - The company ID
	 */
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
