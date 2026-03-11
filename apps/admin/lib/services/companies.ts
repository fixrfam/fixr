import { db, eq } from "@fixr/db/connection";
import { companies, employees, users } from "@fixr/db/schema";
import type { createCompanySchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { hashPassword } from "../pwd";

export async function getEmployeeByCpf(cpf: string) {
	const [data] = await db
		.select()
		.from(employees)
		.where(eq(employees.cpf, cpf));
	return data;
}

export async function getCompanyByCnpj(cnpj: string) {
	const [data] = await db
		.select()
		.from(companies)
		.where(eq(companies.cnpj, cnpj));
	return data;
}

export async function getUserByEmail(email: string) {
	const [data] = await db.select().from(users).where(eq(users.email, email));
	return data;
}

export async function getCompanyBySubdomain(subdomain: string) {
	const [data] = await db
		.select()
		.from(companies)
		.where(eq(companies.subdomain, subdomain));
	return data;
}

export async function createOrgWithAdmin(
	data: z.infer<typeof createCompanySchema>
) {
	const [orgId] = await db.insert(companies).values(data).$returningId();

	const [adminId] = await db
		.insert(users)
		.values({
			email: data.owner_email,
			passwordHash: await hashPassword(data.owner_password),
			verified: true,
		})
		.$returningId();

	await db.insert(employees).values({
		name: "Admin",
		cpf: data.owner_cpf,
		role: "admin" as const,
		userId: adminId?.id as string,
		companyId: orgId?.id as string,
	});
}
