import { createId } from "@paralleldrive/cuid2";
import {
	int,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { customers } from "./customers";
import { devices } from "./devices";
import { employees } from "./employees";

export const serviceOrderStatusValues = [
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
] as const;

export const serviceOrderStatusEnum = mysqlEnum(
	"status",
	serviceOrderStatusValues
);

export const serviceOrders = mysqlTable(
	"service_orders",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		/**
		 * Sequential per company (1, 2, 3...), shown as `<SUBDOMAIN>-<number>`
		 * (e.g. `ACME-12`) so people can say and search it.
		 */
		number: int("number").notNull(),
		customerId: varchar("customer_id", { length: 25 })
			.references(() => customers.id, { onDelete: "restrict" })
			.notNull(),
		employeeId: varchar("employee_id", { length: 25 })
			.references(() => employees.id, { onDelete: "restrict" })
			.notNull(),
		/** The customer's device being repaired (its model, IMEI and status live there). */
		deviceId: varchar("device_id", { length: 25 })
			.references(() => devices.id, { onDelete: "restrict" })
			.notNull(),
		reportedDefect: text("reported_defect").notNull(),
		observations: text("observations"),
		status: serviceOrderStatusEnum.default("pending").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("service_orders_company_number_idx").on(
			table.companyId,
			table.number
		),
	]
);

export const serviceOrderSelectSchema = createSelectSchema(serviceOrders, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
