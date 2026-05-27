import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

export const categories = mysqlTable("categories", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).unique().notNull(),
});

export const categorySelectSchema = createSelectSchema(categories);
export type CategoryInsert = typeof categories.$inferInsert;
export type CategorySelect = typeof categories.$inferSelect;
