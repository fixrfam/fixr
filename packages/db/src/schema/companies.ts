import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = mysqlTable("companies", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	cnpj: varchar("cnpj", { length: 14 }).unique().notNull(),
	address: varchar("address", { length: 255 }),
	/** Public contact data shown on documents (estimate PDF header and footer). */
	email: varchar("email", { length: 255 }),
	/** Digits only. */
	phone: varchar("phone", { length: 11 }),
	website: varchar("website", { length: 255 }),
	/** Public R2 URL of the logo, uploaded through the `company-logo` presign purpose. */
	logoUrl: varchar("logo_url", { length: 500 }),
	subdomain: varchar("subdomain", { length: 32 }).unique().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const companySelectSchema = createSelectSchema(companies, {
	createdAt: z.coerce.date(),
});

export const companyInsertSchema = createInsertSchema(companies);
