import { createId } from "@paralleldrive/cuid2";
import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { companies } from "./companies";
import { customers } from "./customers";

/**
 * Access links to the customer portal, sent by email.
 *
 * The link is the customer's account: whoever opens it proves they receive email
 * at `email`, and the portal shows the service orders of every customer record
 * with the same `cpf` and `email`, in any shop (plus `customer_id`, the record
 * the link was issued for). Only the SHA-256 of the token is stored.
 *
 * `company_id`/`customer_id` are set when a shop sent the link; sending again
 * revokes that shop's previous links for the customer. Links the customer asked
 * for themselves have neither.
 */
export const portalLinks = mysqlTable(
	"portal_links",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
		/** Digits only. */
		cpf: varchar("cpf", { length: 11 }).notNull(),
		/** Lowercase. */
		email: varchar("email", { length: 255 }).notNull(),
		companyId: varchar("company_id", { length: 25 }).references(
			() => companies.id,
			{ onDelete: "cascade" }
		),
		customerId: varchar("customer_id", { length: 25 }).references(
			() => customers.id,
			{ onDelete: "cascade" }
		),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		lastUsedAt: timestamp("last_used_at"),
		revokedAt: timestamp("revoked_at"),
	},
	(table) => ({
		customerIdx: index("portal_links_customer_idx").on(table.customerId),
	})
);

/**
 * A browser signed in to the customer portal (opaque token in an httpOnly
 * cookie, only its SHA-256 stored). It carries the identity of the link it was
 * opened from, and ends when that link is revoked.
 */
export const portalSessions = mysqlTable("portal_sessions", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
	/** Portal link the session was opened from; null when opened from an estimate link. */
	portalLinkId: varchar("portal_link_id", { length: 25 }).references(
		() => portalLinks.id,
		{ onDelete: "cascade" }
	),
	/** Digits only. */
	cpf: varchar("cpf", { length: 11 }).notNull(),
	/** Lowercase. */
	email: varchar("email", { length: 255 }).notNull(),
	/** Customer record the access was issued for, always visible to the session. */
	customerId: varchar("customer_id", { length: 25 }).references(
		() => customers.id,
		{
			onDelete: "set null",
		}
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
});
