import { createId } from "@paralleldrive/cuid2";
import {
	int,
	mysqlTable,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { money } from "./columns";
import { companies } from "./companies";
import { suppliers } from "./suppliers";

export const parts = mysqlTable(
	"parts",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		supplierId: varchar("supplier_id", { length: 25 })
			.references(() => suppliers.id, { onDelete: "restrict" })
			.notNull(),
		sku: varchar("sku", { length: 50 }).notNull(),
		name: varchar("name", { length: 120 }).notNull(),
		description: text("description"),
		category: varchar("category", { length: 60 }).notNull(),
		costPrice: money("cost_price").notNull(),
		salePrice: money("sale_price").notNull(),
		stock: int("stock").notNull().default(0),
		minStock: int("min_stock").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		skuCompanyUnique: unique("parts_sku_company_unique").on(
			table.companyId,
			table.sku
		),
	})
);

export const partSelectSchema = createSelectSchema(parts, {
	costPrice: z.number(),
	salePrice: z.number(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
