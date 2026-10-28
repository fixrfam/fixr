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
	companies,
	customers,
	devices,
	estimates,
	modelMakers,
	models,
	portalLinks,
	portalSessions,
	serviceOrderItems,
	serviceOrders,
} from "@fixr/db/schema";

/** Who a portal session belongs to: the CPF and the email the link reached. */
export interface PortalIdentity {
	cpf: string;
	email: string;
	/** Customer record the access was issued for, always in scope. */
	customerId: string | null;
}

/** @description Data access layer for the customer portal */
export class PortalRepository {
	static async insertLink(values: typeof portalLinks.$inferInsert) {
		await db.insert(portalLinks).values(values);
	}

	/** Revoke the links a shop sent to one of its customers. */
	static async revokeShopLinks(customerId: string, companyId: string) {
		await db
			.update(portalLinks)
			.set({ revokedAt: new Date() })
			.where(
				and(
					eq(portalLinks.customerId, customerId),
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
				customerId: portalSessions.customerId,
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

	/** Customer records (any shop) registered with this email. */
	static async queryCustomersByEmail(email: string) {
		return await db
			.select({ id: customers.id, cpf: customers.cpf, name: customers.name })
			.from(customers)
			.where(
				and(
					sql`LOWER(${customers.email}) = ${email}`,
					isNull(customers.deletedAt)
				)
			)
			.orderBy(desc(customers.createdAt));
	}

	static async queryCustomer(customerId: string) {
		const [customer] = await db
			.select({
				id: customers.id,
				companyId: customers.companyId,
				cpf: customers.cpf,
				name: customers.name,
				email: customers.email,
				deletedAt: customers.deletedAt,
			})
			.from(customers)
			.where(eq(customers.id, customerId))
			.limit(1);
		return customer ?? null;
	}

	/**
	 * Customer records the identity can see: same CPF and same email in any shop,
	 * plus the record the access was issued for. Deleted records are hidden.
	 */
	static async queryScopeCustomers(identity: PortalIdentity) {
		const sameIdentity = and(
			eq(customers.cpf, identity.cpf),
			sql`LOWER(${customers.email}) = ${identity.email}`
		);
		return await db
			.select({ id: customers.id, name: customers.name })
			.from(customers)
			.where(
				and(
					isNull(customers.deletedAt),
					identity.customerId
						? or(sameIdentity, eq(customers.id, identity.customerId))
						: sameIdentity
				)
			)
			.orderBy(desc(customers.updatedAt));
	}

	static async queryServiceOrders(customerIds: string[]) {
		if (customerIds.length === 0) {
			return [];
		}
		return await db
			.select({
				id: serviceOrders.id,
				number: serviceOrders.number,
				subdomain: companies.subdomain,
				status: serviceOrders.status,
				deviceMaker: modelMakers.name,
				deviceModel: models.name,
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
			.innerJoin(devices, eq(devices.id, serviceOrders.deviceId))
			.innerJoin(models, eq(models.id, devices.modelId))
			.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
			.where(inArray(serviceOrders.customerId, customerIds))
			.orderBy(desc(serviceOrders.createdAt));
	}

	static async queryServiceOrder(
		serviceOrderId: string,
		customerIds: string[]
	) {
		if (customerIds.length === 0) {
			return null;
		}
		const [serviceOrder] = await db
			.select({
				id: serviceOrders.id,
				number: serviceOrders.number,
				subdomain: companies.subdomain,
				companyId: serviceOrders.companyId,
				status: serviceOrders.status,
				deviceMaker: modelMakers.name,
				deviceModel: models.name,
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
			.innerJoin(devices, eq(devices.id, serviceOrders.deviceId))
			.innerJoin(models, eq(models.id, devices.modelId))
			.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
			.where(
				and(
					eq(serviceOrders.id, serviceOrderId),
					inArray(serviceOrders.customerId, customerIds)
				)
			)
			.limit(1);
		return serviceOrder ?? null;
	}

	static async queryServiceOrderItems(serviceOrderId: string) {
		return await db
			.select({
				id: serviceOrderItems.id,
				parentItemId: serviceOrderItems.parentItemId,
				type: serviceOrderItems.type,
				name: serviceOrderItems.name,
				quantity: serviceOrderItems.quantity,
				unitPrice: serviceOrderItems.unitPrice,
			})
			.from(serviceOrderItems)
			.where(eq(serviceOrderItems.serviceOrderId, serviceOrderId))
			.orderBy(serviceOrderItems.createdAt, serviceOrderItems.id);
	}

	/** Estimates the customer was sent (drafts stay internal to the shop). */
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
	static async queryEstimate(estimateId: string, customerIds: string[]) {
		if (customerIds.length === 0) {
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
					inArray(serviceOrders.customerId, customerIds)
				)
			)
			.limit(1);
		return estimate ?? null;
	}
}
