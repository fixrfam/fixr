import { createId } from "@paralleldrive/cuid2";
import { json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { employees } from "./employees";

/**
 * Programmatic access keys scoped to a company.
 *
 * The plaintext secret never touches the database: only `keyHash` is stored.
 * `prefix` is the public, uniquely indexed handle used to look a key up in a
 * single query before the secret is verified.
 */
export const apiKeys = mysqlTable("api_keys", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	prefix: varchar("prefix", { length: 16 }).unique().notNull(),
	keyHash: varchar("key_hash", { length: 255 }).notNull(),
	employeeId: varchar("employee_id", { length: 25 })
		.references(() => employees.id, { onDelete: "cascade" })
		.notNull(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	/** Permission strings that narrow the creator's role. `[]` means "inherit the role as-is". */
	scopes: json("scopes").$type<string[]>().notNull().default([]),
	expiresAt: timestamp("expires_at"),
	lastUsedAt: timestamp("last_used_at"),
	revokedAt: timestamp("revoked_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Here we override the date columns with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const apiKeySelectSchema = createSelectSchema(apiKeys, {
	scopes: z.array(z.string()),
	expiresAt: z.coerce.date().nullable(),
	lastUsedAt: z.coerce.date().nullable(),
	revokedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
});

/** Public representation of an API key. The hash is never exposed through the API. */
export const apiKeyPublicSchema = apiKeySelectSchema.omit({ keyHash: true });
