import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

/** @description Device categories table: groups models by type (e.g. smartphone, tablet) */
export const modelCategories = mysqlTable("model_categories", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
});

/** @description Zod schema for selecting a category record */
export const modelCategorySelectSchema = createSelectSchema(modelCategories);
export type CategoryInsert = typeof modelCategories.$inferInsert;
export type CategorySelect = typeof modelCategories.$inferSelect;
