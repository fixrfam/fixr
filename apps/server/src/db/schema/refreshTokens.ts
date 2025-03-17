import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";

import { users } from "./users";

export const refreshTokens = mysqlTable("refresh_tokens", {
    id: varchar("id", { length: 25 })
        .$defaultFn(() => createId())
        .primaryKey(),
    token: varchar("token", { length: 128 }).notNull().unique(),
    userId: varchar("user_id", { length: 25 })
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});
