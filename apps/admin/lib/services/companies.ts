import { eq } from "drizzle-orm";
import { db } from "@repo/db/connection";
import { employees, companies, users } from "@repo/db/schema";
import { z } from "zod";
import { createCompanySchema } from "@repo/schemas/companies";
import { hashPassword } from "../pwd";

export async function getEmployeeByCpf(cpf: string) {
    const [data] = await db.select().from(employees).where(eq(employees.cpf, cpf));
    return data;
}

export async function getCompanyByCnpj(cnpj: string) {
    const [data] = await db.select().from(companies).where(eq(companies.cnpj, cnpj));
    return data;
}

export async function getUserByEmail(email: string) {
    const [data] = await db.select().from(users).where(eq(users.email, email));
    return data;
}

export async function getCompanyBySubdomain(subdomain: string) {
    const [data] = await db.select().from(companies).where(eq(companies.subdomain, subdomain));
    return data;
}

export async function createOrgWithAdmin(data: z.infer<typeof createCompanySchema>) {
    const [orgId] = await db.insert(companies).values(data).$returningId();

    const [adminId] = await db
        .insert(users)
        .values({
            email: data.owner_email,
            passwordHash: await hashPassword(data.owner_password),
            verified: true,
        })
        .$returningId();

    const [employeeId] = await db.insert(employees).values({
        cpf: data.owner_cpf,
        name: "Admin",
        role: "admin",
        userId: adminId!.id,
        companyId: orgId!.id,
    }); // Without this $inferInsert type assingning, this bug shows up: https://github.com/drizzle-team/drizzle-orm/issues/2889#issuecomment-232316575

    console.log({ orgId, adminId, employeeId });
}
