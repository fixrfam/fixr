import { hashPassword } from "@/src/helpers/hash-password";
import { unmask } from "@fixr/constants/masks";
import { db } from "@fixr/db/connection";
import { employees, users } from "@fixr/db/schema";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function getEmployeeByCpf(cpf: string) {
    const [data] = await db.select().from(employees).where(eq(employees.cpf, cpf));
    return data;
}

export async function createEmployeeAndAccount({
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
        companyId: companyId,
    });
}
