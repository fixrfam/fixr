import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { createId } from '@paralleldrive/cuid2';

import { users } from './users';

export const ottTypeEnum = pgEnum("ott_type", [
    "confirmation",
    "password_reset",
    "account_deletion",
]);

export const oneTimeTokens = pgTable("one_time_tokens", {
    id: text("id")
        .$defaultFn(() => createId())
        .primaryKey(),
    token: text("token").notNull().unique(),
    tokenType: ottTypeEnum("token_type").notNull(),
    relatesTo: text("relates_to"),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});
