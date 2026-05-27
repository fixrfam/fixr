import { createId } from "@paralleldrive/cuid2";
import {
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "./clients";
import { companies } from "./companies";
import { deviceBrands } from "./device-brands";
import { deviceCategories } from "./device-categories";
import { employees } from "./employees";

export const serviceOrderStatusEnum = mysqlEnum("status", [
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
]);

export const serviceOrders = mysqlTable("service_orders", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	clientId: varchar("client_id", { length: 25 })
		.references(() => clients.id, { onDelete: "restrict" })
		.notNull(),
	employeeId: varchar("employee_id", { length: 25 })
		.references(() => employees.id, { onDelete: "restrict" })
		.notNull(),
	deviceBrandId: varchar("device_brand_id", { length: 25 })
		.references(() => deviceBrands.id, { onDelete: "restrict" })
		.notNull(),
	deviceCategoryId: varchar("device_category_id", { length: 25 })
		.references(() => deviceCategories.id, { onDelete: "restrict" })
		.notNull(),
	deviceModel: varchar("device_model", { length: 100 }).notNull(),
	imei: varchar("imei", { length: 50 }),
	reportedDefect: text("reported_defect").notNull(),
	observations: text("observations"),
	status: serviceOrderStatusEnum.default("pending").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export const serviceOrderSelectSchema = createSelectSchema(serviceOrders, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
