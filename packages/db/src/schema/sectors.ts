import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";

/**
 * A team of the shop (front desk, bench, warehouse...). Employees belong to
 * one, and a service order sits in the pool of the sector responsible for its
 * current stage.
 */
export const sectors = mysqlTable(
	"sectors",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar("name", { length: 80 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("sectors_company_name_unique").on(table.companyId, table.name),
	]
);

export const sectorSelectSchema = createSelectSchema(sectors, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
