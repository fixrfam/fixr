import { db, eq } from "@fixr/db/connection";
import {
	companies,
	companySelectSchema,
	employees,
	users,
} from "@fixr/db/schema";
import type { createCompanySchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { hashPassword } from "../../../core/lib/hash-password";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

/** @description Companies data access layer */
export class CompaniesRepository {
	/**
	 * Query a company by its ID, with caching
	 *
	 * @param id - The company ID
	 * @returns The parsed company data
	 */
	@Cached({ ttl: 3600, key: "company" })
	static async queryCompanyById(id: string) {
		const [company] = await db
			.select()
			.from(companies)
			.where(eq(companies.id, id))
			.limit(1);

		if (!company) {
			return undefined;
		}

		return companySelectSchema.parse(company);
	}

	/**
	 * Query a company by its subdomain, with caching
	 *
	 * @param subdomain - The company subdomain
	 * @returns The parsed company data
	 */
	@Cached({ ttl: 3600, key: "company:subdomain" })
	static async queryCompanyBySubdomain(subdomain: string) {
		const [company] = await db
			.select()
			.from(companies)
			.where(eq(companies.subdomain, subdomain))
			.limit(1);

		if (!company) {
			return undefined;
		}

		return companySelectSchema.parse(company);
	}

	/** @description Check if an employee with the given CPF exists */
	static async queryEmployeeByCpf(cpf: string) {
		const [data] = await db
			.select()
			.from(employees)
			.where(eq(employees.cpf, cpf));
		return data;
	}

	/** @description Check if a company with the given CNPJ exists */
	static async queryCompanyByCnpj(cnpj: string) {
		const [data] = await db
			.select()
			.from(companies)
			.where(eq(companies.cnpj, cnpj));
		return data;
	}

	/** @description Check if a user with the given email exists */
	static async queryUserByEmail(email: string) {
		const [data] = await db.select().from(users).where(eq(users.email, email));
		return data;
	}

	/**
	 * @description Create a company, user, and employee (admin) in sequence
	 */
	@InvalidateCache({ patterns: ["company:*"] })
	static async createOrgWithAdmin(data: z.infer<typeof createCompanySchema>) {
		const [orgId] = await db
			.insert(companies)
			.values({
				name: data.name,
				cnpj: data.cnpj,
				address: data.address || null,
				subdomain: data.subdomain,
			})
			.$returningId();

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
}
