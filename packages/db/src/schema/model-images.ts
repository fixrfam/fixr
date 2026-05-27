import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	int,
	mysqlTable,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { models } from "./models";

export const modelImages = mysqlTable("model_images", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	modelId: varchar("model_id", { length: 25 })
		.notNull()
		.references(() => models.id),
	originalUrl: varchar("original_url", { length: 255 }),
	r2Key: varchar("r2_key", { length: 255 }),
	isPrimary: boolean("is_primary").notNull().default(false),
	variant: varchar("variant", { length: 50 }),
	position: int("position").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelImageSelectSchema = createSelectSchema(modelImages, {
	createdAt: z.coerce.date(),
});
export type ModelImageInsert = typeof modelImages.$inferInsert;
export type ModelImageSelect = typeof modelImages.$inferSelect;
