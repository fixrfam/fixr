import {
	and,
	asc,
	db,
	desc,
	eq,
	isNull,
	like,
	or,
	type SQL,
} from "@fixr/db/connection";
import { clients, devices, models, serviceOrders } from "@fixr/db/schema";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type ClientInsert = typeof clients.$inferInsert;

/** How many of the client's latest service orders the detail route returns. */
const RECENT_SERVICE_ORDERS = 20;

/** @description Data access layer for a company's clients */
export class ClientsRepository {
	/**
	 * WHERE clause for listing the company's active (not deleted) clients
	 *
	 * @param companyId - Tenant the clients belong to
	 * @param query - Optional search on name, CPF, phone and e-mail
	 */
	static buildListFilter(companyId: string, query?: string) {
		const conditions: SQL[] = [
			eq(clients.companyId, companyId),
			isNull(clients.deletedAt),
		];

		if (query) {
			conditions.push(
				or(
					like(clients.name, `%${query}%`),
					like(clients.cpf, `%${query}%`),
					like(clients.phone, `%${query}%`),
					like(clients.email, `%${query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "name") {
		if (sort === "name") {
			return asc(clients.name);
		}
		return sort === "older" ? asc(clients.createdAt) : desc(clients.createdAt);
	}

	@Cached({ ttl: 3600, key: "clients:id" })
	static async queryClientById(clientId: string) {
		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);
		return client ?? null;
	}

	/** Any client of the company with this CPF, deleted ones included. */
	static async queryClientByCpf(companyId: string, cpf: string) {
		const [client] = await db
			.select({ id: clients.id, deletedAt: clients.deletedAt })
			.from(clients)
			.where(and(eq(clients.companyId, companyId), eq(clients.cpf, cpf)))
			.limit(1);
		return client ?? null;
	}

	static async queryRecentServiceOrders(clientId: string, companyId: string) {
		return await db
			.select({
				id: serviceOrders.id,
				number: serviceOrders.number,
				deviceId: serviceOrders.deviceId,
				deviceModel: models.name,
				status: serviceOrders.status,
				createdAt: serviceOrders.createdAt,
			})
			.from(serviceOrders)
			.innerJoin(devices, eq(devices.id, serviceOrders.deviceId))
			.innerJoin(models, eq(models.id, devices.modelId))
			.where(
				and(
					eq(serviceOrders.clientId, clientId),
					eq(serviceOrders.companyId, companyId)
				)
			)
			.orderBy(desc(serviceOrders.createdAt))
			.limit(RECENT_SERVICE_ORDERS);
	}

	// Service orders cache the client they point to.
	@InvalidateCache({ patterns: ["clients:*", "service-orders:*"] })
	static async insertClient(values: ClientInsert) {
		const [inserted] = await db.insert(clients).values(values).$returningId();
		return inserted.id;
	}

	@InvalidateCache({ patterns: ["clients:*", "service-orders:*"] })
	static async updateClient(clientId: string, values: Partial<ClientInsert>) {
		await db.update(clients).set(values).where(eq(clients.id, clientId));
	}
}
