import { createId } from "@paralleldrive/cuid2";
import {
	int,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "./clients";
import { money, percentage } from "./columns";
import { companies } from "./companies";
import { employees } from "./employees";
import { parts } from "./parts";
import { serviceOrderItemTypeEnum } from "./service-order-items";
import { serviceOrders } from "./service-orders";
import { services } from "./services";

export const estimateStatusEnum = mysqlEnum("estimate_status", [
	"draft",
	"sent",
	"approved",
	"rejected",
]);

/**
 * A priced proposal for a service order, sent to the client for approval.
 *
 * `number` is sequential per company and is what the client sees. The items
 * are copied from the service order when the estimate is created, so the
 * estimate never changes after it is sent.
 */
export const estimates = mysqlTable(
	"estimates",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		companyId: varchar("company_id", { length: 25 })
			.references(() => companies.id, { onDelete: "cascade" })
			.notNull(),
		serviceOrderId: varchar("service_order_id", { length: 25 })
			.references(() => serviceOrders.id, { onDelete: "cascade" })
			.notNull(),
		clientId: varchar("client_id", { length: 25 }).references(
			() => clients.id,
			{ onDelete: "set null" }
		),
		createdBy: varchar("created_by", { length: 25 }).references(
			() => employees.id,
			{ onDelete: "set null" }
		),
		number: int("number").notNull(),
		status: estimateStatusEnum.default("draft").notNull(),
		discountPercentage: percentage("discount_percentage").notNull().default(0),
		validUntil: timestamp("valid_until").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		numberCompanyUnique: unique("estimates_number_company_unique").on(
			table.companyId,
			table.number
		),
	})
);

export const estimateItems = mysqlTable("estimate_items", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	estimateId: varchar("estimate_id", { length: 25 })
		.references(() => estimates.id, { onDelete: "cascade" })
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
	quantity: int("quantity").notNull(),
	unitPrice: money("unit_price").notNull(),
	position: int("position").notNull().default(0),
});

export const estimateSelectSchema = createSelectSchema(estimates, {
	discountPercentage: z.number(),
	validUntil: z.coerce.date(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const estimateItemSelectSchema = createSelectSchema(estimateItems, {
	unitPrice: z.number(),
});
