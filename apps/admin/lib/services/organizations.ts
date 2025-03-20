import { eq } from "drizzle-orm";
import { db } from "@repo/db/connection";
import { employees, organizations, users } from "@repo/db/schema";
import { z } from "zod";
import { createOrganizationSchema } from "@repo/schemas/organizations";
import { hashPassword } from "../pwd";

export async function getEmployeeByCpf(cpf: string) {
    const [data] = await db.select().from(employees).where(eq(employees.cpf, cpf));
    return data;
}

export async function getOrganizationByCnpj(cnpj: string) {
    const [data] = await db.select().from(organizations).where(eq(organizations.cnpj, cnpj));
    return data;
}

export async function getUserByEmail(email: string) {
    const [data] = await db.select().from(users).where(eq(users.email, email));
    return data;
}

export async function getOrganizationBySubdomain(subdomain: string) {
    const [data] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.subdomain, subdomain));
    return data;
}

export async function createOrgWithAdmin(data: z.infer<typeof createOrganizationSchema>) {
    const [orgId] = await db.insert(organizations).values(data).$returningId();

    const [adminId] = await db
        .insert(users)
        .values({
            email: data.owner_email,
            passwordHash: await hashPassword(data.owner_password),
            verified: true,
        })
        .$returningId();

    await db.insert(employees).values({
        cpf: data.owner_cpf,
        name: "Admin",
        role: "admin",
        userId: adminId?.id,
        organizationId: orgId?.id,
    } as typeof employees.$inferInsert); // Without this $inferInsert type assingning, this bug shows up: https://github.com/drizzle-team/drizzle-orm/issues/2889#issuecomment-2323165751
}
