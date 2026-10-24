import {
	and,
	db,
	desc,
	eq,
	gt,
	inArray,
	isNull,
	ne,
	or,
	sql,
} from "@fixr/db/connection";
import {
	clients,
	companies,
	estimates,
	modelMakers,
	portalLinks,
	portalSessions,
	serviceOrderItems,
	serviceOrders,
} from "@fixr/db/schema";

/** Who a portal session belongs to: the CPF and the email the link reached. */
export interface PortalIdentity {
	cpf: string;
	email: string;
	/** Client record the access was issued for, always in scope. */
	clientId: string | null;
}

/** @description Data access layer for the client portal */
export class PortalRepository {
	static async insertLink(values: typeof portalLinks.$inferInsert) {
		await db.insert(portalLinks).values(values);
	}

	/** Revoke the links a shop sent to one of its clients. */
	static async revokeShopLinks(clientId: string, companyId: string) {
		await db
			.update(portalLinks)
			.set({ revokedAt: new Date() })
			.where(
				and(
					eq(portalLinks.clientId, clientId),
					eq(portalLinks.companyId, companyId),
					isNull(portalLinks.revokedAt)
				)
			);
	}

	static async queryActiveLink(tokenHash: string) {
		const [link] = await db
			.select()
			.from(portalLinks)
			.where(
				and(eq(portalLinks.tokenHash, tokenHash), isNull(portalLinks.revokedAt))
			)
			.limit(1);
		return link ?? null;
	}

	static async touchLink(linkId: string) {
		await db
			.update(portalLinks)
			.set({ lastUsedAt: new Date() })
			.where(eq(portalLinks.id, linkId));
	}

	static async insertSession(values: typeof portalSessions.$inferInsert) {
		await db.insert(portalSessions).values(values);
	}

	/** A session that has not expired and whose link (if any) was not revoked. */
	static async queryActiveSession(tokenHash: string) {
		const [session] = await db
			.select({
				id: portalSessions.id,
				cpf: portalSessions.cpf,
				email: portalSessions.email,
				clientId: portalSessions.clientId,
			})
			.from(portalSessions)
			.leftJoin(portalLinks, eq(portalLinks.id, portalSessions.portalLinkId))
			.where(
				and(
					eq(portalSessions.tokenHash, tokenHash),
					gt(portalSessions.expiresAt, new Date()),
					isNull(portalLinks.revokedAt)
				)
			)
			.limit(1);
		return session ?? null;
	}

	static async deleteSession(tokenHash: string) {
		await db
			.delete(portalSessions)
			.where(eq(portalSessions.tokenHash, tokenHash));
	}

	/** Client records (any shop) registered with this email. */
	static async queryClientsByEmail(email: string) {
		return await db
			.select({ id: clients.id, cpf: clients.cpf, name: clients.name })
			.from(clients)
			.where(
				and(sql`LOWER(${clients.email}) = ${email}`, isNull(clients.deletedAt))
			)
			.orderBy(desc(clients.createdAt));
	}

	static async queryClient(clientId: string) {
		const [client] = await db
			.select({
				id: clients.id,
				companyId: clients.companyId,
				cpf: clients.cpf,
				name: clients.name,
				email: clients.email,
				deletedAt: clients.deletedAt,
			})
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);
		return client ?? null;
	}

	/**
	 * Client records the identity can see: same CPF and same email in any shop,
	 * plus the record the access was issued for. Deleted records are hidden.
	 */
	static async queryScopeClients(identity: PortalIdentity) {
		const sameIdentity = and(
			eq(clients.cpf, identity.cpf),
			sql`LOWER(${clients.email}) = ${identity.email}`
		);
		return await db
			.select({ id: clients.id, name: clients.name })
			.from(clients)
			.where(
				and(
					isNull(clients.deletedAt),
					identity.clientId
						? or(sameIdentity, eq(clients.id, identity.clientId))
						: sameIdentity
				)
			)
			.orderBy(desc(clients.updatedAt));
	}

	static async queryServiceOrders(clientIds: string[]) {
		if (clientIds.length === 0) {
			return [];
		}
		return await db
			.select({
				id: serviceOrders.id,
				status: serviceOrders.status,
				deviceMaker: modelMakers.name,
				deviceModel: serviceOrders.deviceModel,
				createdAt: serviceOrders.createdAt,
				updatedAt: serviceOrders.updatedAt,
				company: { name: companies.name, logoUrl: companies.logoUrl },
				pendingEstimate: sql<number>`EXISTS (
					SELECT 1 FROM ${estimates}
					WHERE ${estimates.serviceOrderId} = ${serviceOrders.id}
					AND ${estimates.status} = 'sent'
				)`,
			})
			.from(serviceOrders)
			.innerJoin(companies, eq(companies.id, serviceOrders.companyId))
			.innerJoin(modelMakers, eq(modelMakers.id, serviceOrders.deviceMakerId))
			.where(inArray(serviceOrders.clientId, clientIds))
			.orderBy(desc(serviceOrders.createdAt));
	}

	static async queryServiceOrder(serviceOrderId: string, clientIds: string[]) {
		if (clientIds.length === 0) {
			return null;
		}
		const [serviceOrder] = await db
			.select({
				id: serviceOrders.id,
				companyId: serviceOrders.companyId,
				status: serviceOrders.status,
				deviceMaker: modelMakers.name,
				deviceModel: serviceOrders.deviceModel,
				reportedDefect: serviceOrders.reportedDefect,
				createdAt: serviceOrders.createdAt,
				updatedAt: serviceOrders.updatedAt,
				company: {
					name: companies.name,
					email: companies.email,
					phone: companies.phone,
					website: companies.website,
					address: companies.address,
					logoUrl: companies.logoUrl,
				},
			})
			.from(serviceOrders)
			.innerJoin(companies, eq(companies.id, serviceOrders.companyId))
			.innerJoin(modelMakers, eq(modelMakers.id, serviceOrders.deviceMakerId))
			.where(
				and(
					eq(serviceOrders.id, serviceOrderId),
					inArray(serviceOrders.clientId, clientIds)
				)
			)
			.limit(1);
		return serviceOrder ?? null;
	}

	static async queryServiceOrderItems(serviceOrderId: string) {
		return await db
			.select({
				type: serviceOrderItems.type,
				name: serviceOrderItems.name,
				quantity: serviceOrderItems.quantity,
				unitPrice: serviceOrderItems.unitPrice,
			})
			.from(serviceOrderItems)
			.where(eq(serviceOrderItems.serviceOrderId, serviceOrderId))
			.orderBy(serviceOrderItems.createdAt);
	}

	/** Estimates the client was sent (drafts stay internal to the shop). */
	static async queryServiceOrderEstimates(serviceOrderId: string) {
		return await db
			.select({
				id: estimates.id,
				number: estimates.number,
				status: estimates.status,
				discountPercentage: estimates.discountPercentage,
				validUntil: estimates.validUntil,
				respondedAt: estimates.respondedAt,
				rejectionReason: estimates.rejectionReason,
			})
			.from(estimates)
			.where(
				and(
					eq(estimates.serviceOrderId, serviceOrderId),
					ne(estimates.status, "draft")
				)
			)
			.orderBy(desc(estimates.number));
	}

	/** An estimate of a service order in scope, unless it is still a draft. */
	static async queryEstimate(estimateId: string, clientIds: string[]) {
		if (clientIds.length === 0) {
			return null;
		}
		const [estimate] = await db
			.select({
				id: estimates.id,
				companyId: estimates.companyId,
				serviceOrderId: estimates.serviceOrderId,
				status: estimates.status,
				validUntil: estimates.validUntil,
			})
			.from(estimates)
			.innerJoin(serviceOrders, eq(serviceOrders.id, estimates.serviceOrderId))
			.where(
				and(
					eq(estimates.id, estimateId),
					ne(estimates.status, "draft"),
					inArray(serviceOrders.clientId, clientIds)
				)
			)
			.limit(1);
		return estimate ?? null;
	}
}
