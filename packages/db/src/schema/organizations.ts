import { mysqlTable, varchar, timestamp, text } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const organizations = mysqlTable("organizations", {
    id: varchar("id", { length: 25 })
        .$defaultFn(() => createId())
        .primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    cnpj: varchar("cnpj", { length: 14 }).unique().notNull(),
    address: varchar("address", { length: 255 }),
    subdomain: varchar("subdomain", { length: 32 }).unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const organizationSelectSchema = createSelectSchema(organizations, {
    createdAt: z.coerce.date(),
});
