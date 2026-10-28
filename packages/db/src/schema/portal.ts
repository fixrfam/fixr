import { createId } from "@paralleldrive/cuid2";
import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { clients } from "./clients";
import { companies } from "./companies";

/**
 * Access links to the client portal, sent by email.
 *
 * The link is the client's account: whoever opens it proves they receive email
 * at `email`, and the portal shows the service orders of every client record
 * with the same `cpf` and `email`, in any shop (plus `client_id`, the record
 * the link was issued for). Only the SHA-256 of the token is stored.
 *
 * `company_id`/`client_id` are set when a shop sent the link; sending again
 * revokes that shop's previous links for the client. Links the client asked
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
		clientId: varchar("client_id", { length: 25 }).references(
			() => clients.id,
			{ onDelete: "cascade" }
		),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		lastUsedAt: timestamp("last_used_at"),
		revokedAt: timestamp("revoked_at"),
	},
	(table) => ({
		clientIdx: index("portal_links_client_idx").on(table.clientId),
	})
);

/**
 * A browser signed in to the client portal (opaque token in an httpOnly
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
	/** Client record the access was issued for, always visible to the session. */
	clientId: varchar("client_id", { length: 25 }).references(() => clients.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
});
