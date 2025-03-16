import { mysqlEnum, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

import { createId } from "@paralleldrive/cuid2";

import { users } from "./users";

export const ottTypeEnum = mysqlEnum("ott_type", [
    "confirmation",
    "password_reset",
    "account_deletion",
]);

export const oneTimeTokens = mysqlTable("one_time_tokens", {
    id: varchar("id", { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    tokenType: ottTypeEnum.notNull(),
    relatesTo: varchar("relates_to", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});
