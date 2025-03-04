import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";

import { users } from "./users";

export const refreshTokens = pgTable("refresh_tokens", {
    id: text("id")
        .$defaultFn(() => createId())
        .primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});
