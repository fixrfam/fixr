import { createId } from "@paralleldrive/cuid2";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";
import { serviceOrders } from "./service-orders";

export const serviceOrderPhotos = mysqlTable("service_order_photos", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	serviceOrderId: varchar("service_order_id", { length: 25 })
		.references(() => serviceOrders.id, { onDelete: "cascade" })
		.notNull(),
	employeeId: varchar("employee_id", { length: 25 })
		.references(() => employees.id, { onDelete: "restrict" })
		.notNull(),
	photoUrl: varchar("photo_url", { length: 255 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	sizeInBytes: int("size_in_bytes").notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	description: varchar("description", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceOrderPhotoSelectSchema = createSelectSchema(
	serviceOrderPhotos,
	{
		createdAt: z.coerce.date(),
	}
);
