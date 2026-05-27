import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

export const modelMakers = mysqlTable("model_makers", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
});

export const modelMakerSelectSchema = createSelectSchema(modelMakers);

/** @deprecated Renamed to {@link modelMakers} */
export const deviceBrands = modelMakers;
/** @deprecated Renamed to {@link modelMakerSelectSchema} */
export const deviceBrandSelectSchema = modelMakerSelectSchema;
