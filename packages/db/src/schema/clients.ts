import { createId } from "@paralleldrive/cuid2";
import { mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { users } from "./users";

/**
 * A company's customer.
 *
 * Customers are registered by the shop and scoped to it (`company_id`): the
 * same person can be a customer of several shops, each with its own record.
 * `user_id` is only set when the customer also has a login (client profile).
 *
 * `company_id` is nullable so rows created before customers were scoped could
 * be backfilled from their service orders (see the `backfill_client_company`
 * migration); the API never creates or lists a customer without a company.
 */
export const clients = mysqlTable(
	"clients",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 }).references(
			() => companies.id,
			{ onDelete: "cascade" }
		),
		name: varchar("name", { length: 100 }).notNull(),
		/** Digits only. */
		cpf: varchar("cpf", { length: 11 }).notNull(),
		email: varchar("email", { length: 255 }),
		/** Digits only. */
		phone: varchar("phone", { length: 11 }),
		/** Digits only. */
		alternativePhone: varchar("alternative_phone", { length: 11 }),
		address: varchar("address", { length: 255 }),
		city: varchar("city", { length: 100 }),
		/** Two-letter state code (UF). */
		state: varchar("state", { length: 2 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
		/** Soft delete: deleted customers are hidden but keep their service orders. */
		deletedAt: timestamp("deleted_at"),
		userId: varchar("user_id", { length: 25 }).references(() => users.id), // Cannot cascade here because it would break business logic
	},
	(table) => ({
		cpfCompanyUnique: unique("clients_cpf_company_unique").on(
			table.companyId,
			table.cpf
		),
	})
);

/**
 * Here we override the dates with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const clientSelectSchema = createSelectSchema(clients, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
});
