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
import { departments } from "./departments";
import { employees } from "./employees";
import { serviceOrderStatusValues, serviceOrders } from "./service-orders";

/**
 * Who gets an order when it enters a stage: the department's pool (nobody in
 * particular), its leader, or one employee of the department.
 */
export const stageAssigneeModes = ["pool", "leader", "employee"] as const;

/**
 * Who is responsible for each stage (status) of an order by default: when an
 * order enters the stage, it goes to this department, and to whoever
 * `assigneeMode` says inside it.
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
		departmentId: varchar("department_id", { length: 25 })
			.references(() => departments.id, { onDelete: "cascade" })
			.notNull(),
		assigneeMode: mysqlEnum("assignee_mode", stageAssigneeModes)
			.default("pool")
			.notNull(),
		/** The employee when `assigneeMode` is `employee`; a member of the department. */
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
 * Every change of an order's responsible department or employee: who made it
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
		fromDepartmentId: varchar("from_department_id", { length: 25 }).references(
			() => departments.id,
			{ onDelete: "set null" }
		),
		toDepartmentId: varchar("to_department_id", { length: 25 }).references(
			() => departments.id,
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
