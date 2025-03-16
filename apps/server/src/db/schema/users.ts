import { boolean, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
    id: varchar("id", { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    displayName: varchar("display_name", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    verified: boolean("verified").default(false).notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const userSelectSchema = createSelectSchema(users, {
    createdAt: z.coerce.date(),
});
