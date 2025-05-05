import { text, mysqlTable, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { companies } from "./companies";

export const rolesEnum = mysqlEnum("roles", ["admin", "manager", "technician"]);

export const employees = mysqlTable("employees", {
    id: varchar("id", { length: 25 })
        .$defaultFn(() => createId())
        .primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    cpf: varchar("cpf", { length: 11 }).unique().notNull(),
    phone: varchar("phone", { length: 11 }),
    role: rolesEnum.notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: varchar("user_id", { length: 25 })
        .references(() => users.id) // Cannot cascade here because it would break business logic
        .notNull(),
    companyId: varchar("company_id", { length: 25 })
        .references(() => companies.id, { onDelete: "cascade" })
        .notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const employeeSelectSchema = createSelectSchema(employees, {
    createdAt: z.coerce.date(),
});
