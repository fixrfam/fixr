import { text, mysqlTable, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { organizations } from "./organizations";

export const rolesEnum = mysqlEnum("roles", ["admin", "manager", "employee"]);

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
    organizationId: varchar("organization_id", { length: 25 })
        .references(() => organizations.id, { onDelete: "cascade" })
        .notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const employeeSelectSchema = createSelectSchema(employees, {
    createdAt: z.coerce.date(),
});
