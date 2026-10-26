import {
	and,
	db,
	eq,
	inArray,
	like,
	or,
	type SQL,
	sql,
} from "@fixr/db/connection";
import {
	clients,
	companies,
	devices,
	employees,
	estimateItems,
	estimates,
	modelMakers,
	models,
	serviceOrderItems,
	serviceOrders,
} from "@fixr/db/schema";
import type { getEstimatesQuerySchema } from "@fixr/schemas/estimates";
import type { z } from "zod";

export type EstimateInsert = typeof estimates.$inferInsert;
export type EstimateItemRow = typeof estimateItems.$inferSelect;

/** Estimate columns plus a summary of its client. */
export const estimatesListSelect = {
	id: estimates.id,
	companyId: estimates.companyId,
	serviceOrderId: estimates.serviceOrderId,
	clientId: estimates.clientId,
	createdBy: estimates.createdBy,
	number: estimates.number,
	status: estimates.status,
	discountPercentage: estimates.discountPercentage,
	validUntil: estimates.validUntil,
	notes: estimates.notes,
	createdAt: estimates.createdAt,
	updatedAt: estimates.updatedAt,
	clientName: clients.name,
};

export const estimatesListJoins = [
	{
		type: "left" as const,
		table: clients,
		on: eq(clients.id, estimates.clientId),
	},
];

/** @description Data access layer for estimates */
export class EstimatesRepository {
	static buildListFilter(
		companyId: string,
		filters: Pick<
			z.infer<typeof getEstimatesQuerySchema>,
			"query" | "status" | "serviceOrderId"
		>
	) {
		const conditions: SQL[] = [eq(estimates.companyId, companyId)];

		if (filters.status) {
			conditions.push(eq(estimates.status, filters.status));
		}
		if (filters.serviceOrderId) {
			conditions.push(eq(estimates.serviceOrderId, filters.serviceOrderId));
		}
		if (filters.query) {
			const number = Number.parseInt(filters.query, 10);
			conditions.push(
				or(
					like(clients.name, `%${filters.query}%`),
					...(Number.isNaN(number) ? [] : [eq(estimates.number, number)])
				)!
			);
		}

		return and(...conditions);
	}

	static async queryEstimate(estimateId: string, companyId: string) {
		const [estimate] = await db
			.select(estimatesListSelect)
			.from(estimates)
			.leftJoin(clients, eq(clients.id, estimates.clientId))
			.where(
				and(eq(estimates.id, estimateId), eq(estimates.companyId, companyId))
			)
			.limit(1);
		return estimate ?? null;
	}

	/** Items of each estimate, in their original order. */
	static async queryItemsByEstimateIds(estimateIds: string[]) {
		const byEstimate = new Map<string, EstimateItemRow[]>(
			estimateIds.map((id) => [id, []])
		);
		if (estimateIds.length === 0) {
			return byEstimate;
		}

		const rows = await db
			.select()
			.from(estimateItems)
			.where(inArray(estimateItems.estimateId, estimateIds))
			.orderBy(estimateItems.position);

		for (const row of rows) {
			byEstimate.get(row.estimateId)?.push(row);
		}
		return byEstimate;
	}

	static async queryServiceOrderOfCompany(
		serviceOrderId: string,
		companyId: string
	) {
		const [serviceOrder] = await db
			.select({ id: serviceOrders.id, clientId: serviceOrders.clientId })
			.from(serviceOrders)
			.where(
				and(
					eq(serviceOrders.id, serviceOrderId),
					eq(serviceOrders.companyId, companyId)
				)
			)
			.limit(1);
		return serviceOrder ?? null;
	}

	static async queryServiceOrderItems(serviceOrderId: string) {
		return await db
			.select()
			.from(serviceOrderItems)
			.where(eq(serviceOrderItems.serviceOrderId, serviceOrderId))
			// Same tiebreaker as the service order list, so the copy keeps its order.
			.orderBy(serviceOrderItems.createdAt, serviceOrderItems.id);
	}

	/**
	 * Create the estimate with the next number of the company and its items.
	 * The company row is locked so concurrent estimates can't take the same number.
	 */
	static async createWithItems(
		values: Omit<EstimateInsert, "number">,
		items: Omit<typeof estimateItems.$inferInsert, "estimateId">[]
	) {
		return await db.transaction(async (tx) => {
			await tx
				.select({ id: companies.id })
				.from(companies)
				.where(eq(companies.id, values.companyId))
				.for("update");

			const [{ next }] = await tx
				.select({
					next: sql<number>`COALESCE(MAX(${estimates.number}), 0) + 1`,
				})
				.from(estimates)
				.where(eq(estimates.companyId, values.companyId));

			const [inserted] = await tx
				.insert(estimates)
				.values({ ...values, number: Number(next) })
				.$returningId();

			await tx.insert(estimateItems).values(
				items.map((item, position) => ({
					...item,
					estimateId: inserted.id,
					position,
				}))
			);

			return inserted.id;
		});
	}

	static async updateEstimate(
		estimateId: string,
		values: Partial<EstimateInsert>
	) {
		await db.update(estimates).set(values).where(eq(estimates.id, estimateId));
	}

	static async deleteEstimate(estimateId: string) {
		await db.delete(estimates).where(eq(estimates.id, estimateId));
	}

	/** Everything the PDF prints besides the estimate itself. */
	static async queryPdfContext(estimateId: string) {
		const [row] = await db
			.select({
				company: {
					name: companies.name,
					cnpj: companies.cnpj,
					address: companies.address,
					email: companies.email,
					phone: companies.phone,
					website: companies.website,
					logoUrl: companies.logoUrl,
				},
				device: {
					maker: modelMakers.name,
					model: models.name,
					reportedDefect: serviceOrders.reportedDefect,
				},
			})
			.from(estimates)
			.innerJoin(companies, eq(companies.id, estimates.companyId))
			.innerJoin(serviceOrders, eq(serviceOrders.id, estimates.serviceOrderId))
			.innerJoin(devices, eq(devices.id, serviceOrders.deviceId))
			.innerJoin(models, eq(models.id, devices.modelId))
			.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
			.where(eq(estimates.id, estimateId))
			.limit(1);

		return row ?? null;
	}

	static async queryClient(clientId: string) {
		const [client] = await db
			.select({
				name: clients.name,
				cpf: clients.cpf,
				email: clients.email,
				phone: clients.phone,
				address: clients.address,
				city: clients.city,
				state: clients.state,
			})
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);
		return client ?? null;
	}

	static async queryEmployee(userId: string, companyId: string) {
		const [employee] = await db
			.select({ id: employees.id })
			.from(employees)
			.where(
				and(eq(employees.userId, userId), eq(employees.companyId, companyId))
			)
			.limit(1);
		return employee ?? null;
	}
}
