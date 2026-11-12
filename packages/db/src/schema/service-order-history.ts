import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
	index,
	int,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { serviceOrderStatusValues, serviceOrders } from "./service-orders";

/**
 * The last order number handed out per company. Incremented with a locked
 * write, so two orders opened at the same time never share a number.
 */
export const serviceOrderSequences = mysqlTable("service_order_sequences", {
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.primaryKey(),
	lastNumber: int("last_number").default(0).notNull(),
});

/**
 * Every status an order went through: who moved it, when, and why. The first
 * entry (no `fromStatus`) is the order being opened.
 */
export const serviceOrderHistory = mysqlTable(
	"service_order_history",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		serviceOrderId: varchar("service_order_id", { length: 25 })
			.references(() => serviceOrders.id, { onDelete: "cascade" })
			.notNull(),
		fromStatus: mysqlEnum("from_status", serviceOrderStatusValues),
		toStatus: mysqlEnum("to_status", serviceOrderStatusValues).notNull(),
		/** Null when the system moved it (e.g. the customer approved an estimate). */
		employeeId: varchar("employee_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		note: text("note"),
		// Milliseconds, so changes made in the same second keep their order.
		createdAt: timestamp("created_at", { fsp: 3 })
			.default(sql`now(3)`)
			.notNull(),
	},
	(table) => [index("service_order_history_order_idx").on(table.serviceOrderId)]
);
