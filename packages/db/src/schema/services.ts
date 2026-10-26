import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
	int,
	json,
	mysqlTable,
	primaryKey,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { money } from "./columns";
import { companies } from "./companies";
import { parts } from "./parts";

/** Repair services a company offers (labor), priced separately from parts. */
/** A `[]` default as an expression: TiDB rejects JSON literal defaults (`DEFAULT ('[]')`). */
const JSON_EMPTY_ARRAY = sql`(json_array())`;

export const services = mysqlTable("services", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 120 }).notNull(),
	description: varchar("description", { length: 500 }).notNull(),
	estimatedDurationMinutes: int("estimated_duration_minutes").notNull(),
	price: money("price").notNull(),
	deviceCategories: json("device_categories")
		.$type<string[]>()
		.notNull()
		.default(JSON_EMPTY_ARRAY),
	testInstructions: json("test_instructions")
		.$type<string[]>()
		.notNull()
		.default(JSON_EMPTY_ARRAY),
	testParameters: json("test_parameters")
		.$type<string[]>()
		.notNull()
		.default(JSON_EMPTY_ARRAY),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

/** Parts usually consumed by a service (suggestions, not a bill of materials). */
export const serviceParts = mysqlTable(
	"service_parts",
	{
		serviceId: varchar("service_id", { length: 25 })
			.references(() => services.id, { onDelete: "cascade" })
			.notNull(),
		partId: varchar("part_id", { length: 25 })
			.references(() => parts.id, { onDelete: "cascade" })
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.serviceId, table.partId] }),
	})
);

export const serviceSelectSchema = createSelectSchema(services, {
	price: z.number(),
	deviceCategories: z.array(z.string()),
	testInstructions: z.array(z.string()),
	testParameters: z.array(z.string()),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
