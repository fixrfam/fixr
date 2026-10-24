import { createId } from "@paralleldrive/cuid2";
import {
	int,
	mysqlEnum,
	mysqlTable,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { money } from "./columns";
import { parts } from "./parts";
import { serviceOrders } from "./service-orders";
import { services } from "./services";

export const serviceOrderItemTypeEnum = mysqlEnum("item_type", [
	"part",
	"service",
]);

/**
 * Parts and services used on a service order.
 *
 * `name` and `unit_price` are snapshots taken when the item is added, so the
 * order (and the estimates built from it) keep their values when the catalog
 * changes or the catalog item is deleted (`part_id`/`service_id` become null).
 */
export const serviceOrderItems = mysqlTable("service_order_items", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	serviceOrderId: varchar("service_order_id", { length: 25 })
		.references(() => serviceOrders.id, { onDelete: "cascade" })
		.notNull(),
	type: serviceOrderItemTypeEnum.notNull(),
	partId: varchar("part_id", { length: 25 }).references(() => parts.id, {
		onDelete: "set null",
	}),
	serviceId: varchar("service_id", { length: 25 }).references(
		() => services.id,
		{ onDelete: "set null" }
	),
	name: varchar("name", { length: 120 }).notNull(),
	quantity: int("quantity").notNull().default(1),
	unitPrice: money("unit_price").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export const serviceOrderItemSelectSchema = createSelectSchema(
	serviceOrderItems,
	{
		unitPrice: z.number(),
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
	}
);
