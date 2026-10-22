import { db } from "@fixr/db/connection";
import { employees } from "@fixr/db/schema";
import type { EmployeeRole } from "@fixr/permissions";
import { createId } from "@paralleldrive/cuid2";
import type { TestCompany } from "./company";
import { nextSeq, uniqueDigits } from "./sequence";
import { type MakeUserInput, makeUser } from "./user";

export interface MakeEmployeeInput extends MakeUserInput {
	company: TestCompany;
	role?: EmployeeRole;
	name?: string;
}

export async function makeEmployee(input: MakeEmployeeInput) {
	const user = await makeUser(input);
	const employee = {
		id: createId(),
		name: input.name ?? `Employee ${nextSeq()}`,
		cpf: uniqueDigits(11),
		phone: null,
		role: input.role ?? "admin",
		userId: user.id,
		companyId: input.company.id,
	} as const;

	await db.insert(employees).values(employee);

	return { ...employee, user, company: input.company };
}

export type TestEmployee = Awaited<ReturnType<typeof makeEmployee>>;
