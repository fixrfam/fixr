import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

export const deviceBrands = mysqlTable("device_brands", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
});

export const deviceBrandSelectSchema = createSelectSchema(deviceBrands);
