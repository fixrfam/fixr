import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
	index,
	mysqlEnum,
	mysqlTable,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { sectors } from "./sectors";
import { serviceOrderStatusValues, serviceOrders } from "./service-orders";

/**
 * Who is responsible for each stage (status) of an order by default: when an
 * order enters the stage, it goes to this sector and, when set, employee.
 */
export const serviceOrderStageOwners = mysqlTable(
	"service_order_stage_owners",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		status: mysqlEnum("status", serviceOrderStatusValues).notNull(),
		sectorId: varchar("sector_id", { length: 25 }).references(
			() => sectors.id,
			{ onDelete: "set null" }
		),
		employeeId: varchar("employee_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
	},
	(table) => [
		unique("service_order_stage_owners_company_status_unique").on(
			table.companyId,
			table.status
		),
	]
);

/**
 * Every change of an order's responsible sector or employee: who made it
 * (nobody when a stage's default did) and from what to what.
 */
export const serviceOrderAssignments = mysqlTable(
	"service_order_assignments",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		serviceOrderId: varchar("service_order_id", { length: 25 })
			.references(() => serviceOrders.id, { onDelete: "cascade" })
			.notNull(),
		fromSectorId: varchar("from_sector_id", { length: 25 }).references(
			() => sectors.id,
			{ onDelete: "set null" }
		),
		toSectorId: varchar("to_sector_id", { length: 25 }).references(
			() => sectors.id,
			{ onDelete: "set null" }
		),
		fromAssigneeId: varchar("from_assignee_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		toAssigneeId: varchar("to_assignee_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		/** Who reassigned it; null when the stage's default did. */
		employeeId: varchar("employee_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		// Milliseconds, so changes made in the same second keep their order.
		createdAt: timestamp("created_at", { fsp: 3 })
			.default(sql`now(3)`)
			.notNull(),
	},
	(table) => [
		index("service_order_assignments_order_idx").on(table.serviceOrderId),
	]
);
