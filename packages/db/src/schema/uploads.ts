import { createId } from "@paralleldrive/cuid2";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { employees } from "./employees";

export const uploads = mysqlTable("uploads", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	employeeId: varchar("employee_id", { length: 25 })
		.references(() => employees.id, { onDelete: "restrict" })
		.notNull(),
	key: varchar("key", { length: 512 }).notNull(),
	url: varchar("url", { length: 512 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	sizeInBytes: int("size_in_bytes").notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploadSelectSchema = createSelectSchema(uploads, {
	createdAt: z.coerce.date(),
});
