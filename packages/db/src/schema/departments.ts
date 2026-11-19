import { createId } from "@paralleldrive/cuid2";
import {
	index,
	mysqlTable,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { employees } from "./employees";

/**
 * A team of the shop (front desk, bench, warehouse...). Employees can belong
 * to several, and a service order sits in the pool of the department
 * responsible for its current stage.
 */
export const departments = mysqlTable(
	"departments",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar("name", { length: 80 }).notNull(),
		/** Who answers for the department; stages can send orders to them. */
		leaderId: varchar("leader_id", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("departments_company_name_unique").on(table.companyId, table.name),
	]
);

/** Which employees are in which departments (an employee can be in several). */
export const departmentMembers = mysqlTable(
	"department_members",
	{
		departmentId: varchar("department_id", { length: 25 })
			.references(() => departments.id, { onDelete: "cascade" })
			.notNull(),
		employeeId: varchar("employee_id", { length: 25 })
			.references(() => employees.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.departmentId, table.employeeId] }),
		index("department_members_employee_idx").on(table.employeeId),
	]
);

export const departmentSelectSchema = createSelectSchema(departments, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
