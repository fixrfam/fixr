import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

export const modelCategories = mysqlTable("model_categories", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
});

export const modelCategorySelectSchema = createSelectSchema(modelCategories);

/** @deprecated Renamed to {@link modelCategories} */
export const deviceCategories = modelCategories;
/** @deprecated Renamed to {@link modelCategorySelectSchema} */
export const deviceCategorySelectSchema = modelCategorySelectSchema;
