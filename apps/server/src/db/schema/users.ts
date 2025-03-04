import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: text("id")
        .$defaultFn(() => createId())
        .primaryKey(),
    email: text("email").unique().notNull(),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    verified: boolean("verified").default(false).notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const userSelectSchema = createSelectSchema(users, {
    createdAt: z.coerce.date(),
});
