import {
	and,
	asc,
	db,
	desc,
	eq,
	inArray,
	like,
	or,
	type SQL,
	sql,
} from "@fixr/db/connection";
import { parts, serviceParts, services } from "@fixr/db/schema";
import type { getServicesQuerySchema } from "@fixr/schemas/services";
import type { z } from "zod";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type ServiceInsert = typeof services.$inferInsert;
export type ServiceRecord = typeof services.$inferSelect & {
	partIds: string[];
};

/** @description Data access layer for repair services */
export class ServicesRepository {
	static buildListFilter(
		companyId: string,
		filters: Pick<
			z.infer<typeof getServicesQuerySchema>,
			"query" | "deviceCategory"
		>
	) {
		const conditions: SQL[] = [eq(services.companyId, companyId)];

		if (filters.deviceCategory) {
			conditions.push(
				sql`JSON_CONTAINS(${services.deviceCategories}, JSON_QUOTE(${filters.deviceCategory}))`
			);
		}
		if (filters.query) {
			conditions.push(
				or(
					like(services.name, `%${filters.query}%`),
					like(services.description, `%${filters.query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "name") {
		if (sort === "name") {
			return asc(services.name);
		}
		return sort === "older"
			? asc(services.createdAt)
			: desc(services.createdAt);
	}

	/** Part ids linked to each of the given services. */
	static async queryPartIdsByServiceIds(serviceIds: string[]) {
		const byService = new Map<string, string[]>(
			serviceIds.map((id) => [id, []])
		);
		if (serviceIds.length === 0) {
			return byService;
		}

		const rows = await db
			.select()
			.from(serviceParts)
			.where(inArray(serviceParts.serviceId, serviceIds));

		for (const row of rows) {
			byService.get(row.serviceId)?.push(row.partId);
		}
		return byService;
	}

	/**
	 * Current sale price of each given part. Not cached: a part's price
	 * changes in the parts module, which doesn't clear the services' cache.
	 */
	static async queryPartPrices(partIds: string[]) {
		const prices = new Map<string, number>();
		if (partIds.length === 0) {
			return prices;
		}
		const rows = await db
			.select({ id: parts.id, salePrice: parts.salePrice })
			.from(parts)
			.where(inArray(parts.id, partIds));
		for (const row of rows) {
			prices.set(row.id, row.salePrice);
		}
		return prices;
	}

	@Cached({ ttl: 3600, key: "services:id" })
	static async queryServiceById(
		serviceId: string
	): Promise<ServiceRecord | null> {
		const [service] = await db
			.select()
			.from(services)
			.where(eq(services.id, serviceId))
			.limit(1);

		if (!service) {
			return null;
		}

		const partIds = await ServicesRepository.queryPartIdsByServiceIds([
			serviceId,
		]);
		return { ...service, partIds: partIds.get(serviceId) ?? [] };
	}

	/** The subset of `partIds` that belongs to the company. */
	static async queryPartIdsOfCompany(companyId: string, partIds: string[]) {
		if (partIds.length === 0) {
			return [];
		}
		const rows = await db
			.select({ id: parts.id })
			.from(parts)
			.where(and(eq(parts.companyId, companyId), inArray(parts.id, partIds)));
		return rows.map((row) => row.id);
	}

	@InvalidateCache({ patterns: ["services:*"] })
	static async insertService(values: ServiceInsert, partIds: string[]) {
		return await db.transaction(async (tx) => {
			const [inserted] = await tx
				.insert(services)
				.values(values)
				.$returningId();

			if (partIds.length > 0) {
				await tx
					.insert(serviceParts)
					.values(
						partIds.map((partId) => ({ serviceId: inserted.id, partId }))
					);
			}

			return inserted.id;
		});
	}

	/** Update the service; `partIds` replaces the linked parts when given. */
	@InvalidateCache({ patterns: ["services:*"] })
	static async updateService(
		serviceId: string,
		values: Partial<ServiceInsert>,
		partIds?: string[]
	) {
		await db.transaction(async (tx) => {
			if (Object.keys(values).length > 0) {
				await tx.update(services).set(values).where(eq(services.id, serviceId));
			}

			if (partIds) {
				await tx
					.delete(serviceParts)
					.where(eq(serviceParts.serviceId, serviceId));
				if (partIds.length > 0) {
					await tx
						.insert(serviceParts)
						.values(partIds.map((partId) => ({ serviceId, partId })));
				}
			}
		});
	}

	@InvalidateCache({ patterns: ["services:*"] })
	static async deleteService(serviceId: string) {
		await db.delete(services).where(eq(services.id, serviceId));
	}
}
