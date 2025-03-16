import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";

import { users } from "./users";

export const refreshTokens = mysqlTable("refresh_tokens", {
    id: varchar("id", { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    userId: varchar("user_id", { length: 255 })
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});
