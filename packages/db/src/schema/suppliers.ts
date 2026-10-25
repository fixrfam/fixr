import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";

export const suppliers = mysqlTable(
	"suppliers",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar("name", { length: 120 }).notNull(),
		/** Digits only. */
		cnpj: varchar("cnpj", { length: 14 }).notNull(),
		contact: varchar("contact", { length: 120 }).notNull(),
		phone: varchar("phone", { length: 20 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		cnpjCompanyUnique: unique("suppliers_cnpj_company_unique").on(
			table.companyId,
			table.cnpj
		),
	})
);

export const supplierSelectSchema = createSelectSchema(suppliers, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
