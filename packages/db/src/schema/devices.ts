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
import { companies } from "./companies";
import { customers } from "./customers";
import { models } from "./models";

/**
 * Where a customer's device is: dropped off at the shop, repaired and waiting
 * to be picked up, or back with its owner.
 */
export const deviceStatusEnum = mysqlEnum("status", [
	"in_shop",
	"ready_for_pickup",
	"with_customer",
]);

/**
 * A customer's device: a catalog model owned by one of the company's
 * customers. Service orders are opened for a device, so its repair history
 * stays together across orders.
 */
export const devices = mysqlTable("devices", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	customerId: varchar("customer_id", { length: 25 })
		.references(() => customers.id, { onDelete: "restrict" })
		.notNull(),
	modelId: varchar("model_id", { length: 25 })
		.references(() => models.id, { onDelete: "restrict" })
		.notNull(),
	imei: varchar("imei", { length: 50 }),
	serialNumber: varchar("serial_number", { length: 100 }),
	notes: text("notes"),
	status: deviceStatusEnum.default("with_customer").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
	/** Soft delete: deleted devices are hidden but keep their service orders. */
	deletedAt: timestamp("deleted_at"),
});

export const deviceSelectSchema = createSelectSchema(devices, {
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
});

export type DeviceInsert = typeof devices.$inferInsert;
export type DeviceSelect = typeof devices.$inferSelect;
