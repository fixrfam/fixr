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
import { customers, serviceOrders } from "@fixr/db/schema";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type CustomerInsert = typeof customers.$inferInsert;

/** How many of the customer's latest service orders the detail route returns. */
const RECENT_SERVICE_ORDERS = 20;

/** @description Data access layer for a company's customers */
export class CustomersRepository {
	/**
	 * WHERE clause for listing the company's active (not deleted) customers
	 *
	 * @param companyId - Tenant the customers belong to
	 * @param query - Optional search on name, CPF, phone and e-mail
	 */
	static buildListFilter(companyId: string, query?: string) {
		const conditions: SQL[] = [
			eq(customers.companyId, companyId),
			isNull(customers.deletedAt),
		];

		if (query) {
			conditions.push(
				or(
					like(customers.name, `%${query}%`),
					like(customers.cpf, `%${query}%`),
					like(customers.phone, `%${query}%`),
					like(customers.email, `%${query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "name") {
		if (sort === "name") {
			return asc(customers.name);
		}
		return sort === "older"
			? asc(customers.createdAt)
			: desc(customers.createdAt);
	}

	@Cached({ ttl: 3600, key: "customers:id" })
	static async queryCustomerById(customerId: string) {
		const [customer] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, customerId))
			.limit(1);
		return customer ?? null;
	}

	/** Any customer of the company with this CPF, deleted ones included. */
	static async queryCustomerByCpf(companyId: string, cpf: string) {
		const [customer] = await db
			.select({ id: customers.id, deletedAt: customers.deletedAt })
			.from(customers)
			.where(and(eq(customers.companyId, companyId), eq(customers.cpf, cpf)))
			.limit(1);
		return customer ?? null;
	}

	static async queryRecentServiceOrders(customerId: string, companyId: string) {
		return await db
			.select({
				id: serviceOrders.id,
				deviceModel: serviceOrders.deviceModel,
				status: serviceOrders.status,
				createdAt: serviceOrders.createdAt,
			})
			.from(serviceOrders)
			.where(
				and(
					eq(serviceOrders.customerId, customerId),
					eq(serviceOrders.companyId, companyId)
				)
			)
			.orderBy(desc(serviceOrders.createdAt))
			.limit(RECENT_SERVICE_ORDERS);
	}

	// Service orders cache the customer they point to.
	@InvalidateCache({ patterns: ["customers:*", "service-orders:*"] })
	static async insertCustomer(values: CustomerInsert) {
		const [inserted] = await db.insert(customers).values(values).$returningId();
		return inserted.id;
	}

	@InvalidateCache({ patterns: ["customers:*", "service-orders:*"] })
	static async updateCustomer(
		customerId: string,
		values: Partial<CustomerInsert>
	) {
		await db.update(customers).set(values).where(eq(customers.id, customerId));
	}
}
