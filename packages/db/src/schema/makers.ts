import { createId } from "@paralleldrive/cuid2";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const makers = mysqlTable("makers", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).unique().notNull(),
	url: varchar("url", { length: 255 }).notNull(),
	deviceCount: int("device_count").notNull().default(0),
	pageCount: int("page_count"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const makerSelectSchema = createSelectSchema(makers, {
	createdAt: z.coerce.date(),
});
export type MakerInsert = typeof makers.$inferInsert;
export type MakerSelect = typeof makers.$inferSelect;
