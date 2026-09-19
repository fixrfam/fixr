import {
	and,
	db,
	eq,
	gte,
	inArray,
	like,
	lte,
	or,
	type SQL,
} from "@fixr/db/connection";
import {
	clients,
	employees,
	modelCategories,
	modelMakers,
	serviceOrderImages,
	serviceOrders,
	uploads,
} from "@fixr/db/schema";
import type {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

function endOfDay(date: Date) {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

export const serviceOrdersListSelect = {
	id: serviceOrders.id,
	companyId: serviceOrders.companyId,
	clientId: serviceOrders.clientId,
	employeeId: serviceOrders.employeeId,
	deviceMakerId: serviceOrders.deviceMakerId,
	deviceCategoryId: serviceOrders.deviceCategoryId,
	deviceModel: serviceOrders.deviceModel,
	imei: serviceOrders.imei,
	reportedDefect: serviceOrders.reportedDefect,
	observations: serviceOrders.observations,
	status: serviceOrders.status,
	createdAt: serviceOrders.createdAt,
	updatedAt: serviceOrders.updatedAt,
	client: { id: clients.id, name: clients.name },
	employee: { id: employees.id, name: employees.name },
	deviceCategory: { id: modelCategories.id, name: modelCategories.name },
	deviceMaker: { id: modelMakers.id, name: modelMakers.name },
};

export const serviceOrdersListJoins = [
	{
		type: "inner" as const,
		table: clients,
		on: eq(clients.id, serviceOrders.clientId),
	},
	{
		type: "inner" as const,
		table: employees,
		on: eq(employees.id, serviceOrders.employeeId),
	},
	{
		type: "inner" as const,
		table: modelCategories,
		on: eq(modelCategories.id, serviceOrders.deviceCategoryId),
	},
	{
		type: "inner" as const,
		table: modelMakers,
		on: eq(modelMakers.id, serviceOrders.deviceMakerId),
	},
];

export class ServiceOrdersRepository {
	@Cached({ ttl: 3600, key: "service-orders:employee" })
	static async queryEmployeeByUserId(userId: string) {
		const [employee] = await db
			.select()
			.from(employees)
			.where(eq(employees.userId, userId))
			.limit(1);
		return employee ?? null;
	}

	@Cached({ ttl: 3600, key: "service-orders:client" })
	static async queryClientById(clientId: string) {
		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);
		return client ?? null;
	}

	@Cached({ ttl: 3600, key: "service-orders:device-maker" })
	static async queryDeviceMakerById(deviceMakerId: string) {
		const [maker] = await db
			.select()
			.from(modelMakers)
			.where(eq(modelMakers.id, deviceMakerId))
			.limit(1);
		return maker ?? null;
	}

	@Cached({ ttl: 3600, key: "service-orders:device-category" })
	static async queryDeviceCategoryById(deviceCategoryId: string) {
		const [category] = await db
			.select()
			.from(modelCategories)
			.where(eq(modelCategories.id, deviceCategoryId))
			.limit(1);
		return category ?? null;
	}

	static buildListFilter(
		companyId: string,
		filters: Pick<
			z.infer<typeof getServiceOrdersQuerySchema>,
			| "query"
			| "deviceCategoryId"
			| "employeeId"
			| "status"
			| "dateFrom"
			| "dateTo"
		>
	) {
		const conditions: SQL[] = [eq(serviceOrders.companyId, companyId)];

		if (filters.deviceCategoryId) {
			conditions.push(
				eq(serviceOrders.deviceCategoryId, filters.deviceCategoryId)
			);
		}
		if (filters.employeeId) {
			conditions.push(eq(serviceOrders.employeeId, filters.employeeId));
		}
		if (filters.status) {
			conditions.push(eq(serviceOrders.status, filters.status));
		}
		if (filters.dateFrom) {
			conditions.push(gte(serviceOrders.createdAt, filters.dateFrom));
		}
		if (filters.dateTo) {
			conditions.push(lte(serviceOrders.createdAt, endOfDay(filters.dateTo)));
		}
		if (filters.query) {
			conditions.push(
				or(
					like(serviceOrders.deviceModel, `%${filters.query}%`),
					like(serviceOrders.reportedDefect, `%${filters.query}%`),
					like(clients.name, `%${filters.query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async createWithPhotos({
		companyId,
		employeeId,
		data,
	}: {
		companyId: string;
		employeeId: string;
		data: z.infer<typeof createServiceOrderMockSchema>;
	}) {
		return await db.transaction(async (tx) => {
			const [serviceOrderId] = await tx
				.insert(serviceOrders)
				.values({
					companyId,
					clientId: data.clientId,
					employeeId,
					deviceMakerId: data.deviceBrandId,
					deviceCategoryId: data.deviceCategoryId,
					deviceModel: data.deviceModel,
					imei: data.imei ?? null,
					reportedDefect: data.reportedDefect,
					observations: data.observations ?? null,
				})
				.$returningId();

			if (data.photos.length > 0) {
				const uploadIds = data.photos.map((p) => p.uploadId);
				const uploadRecords = await tx
					.select()
					.from(uploads)
					.where(inArray(uploads.id, uploadIds));

				const uploadMap = new Map(uploadRecords.map((u) => [u.id, u]));

				await tx.insert(serviceOrderImages).values(
					data.photos.map((photo) => {
						const upload = uploadMap.get(photo.uploadId)!;
						return {
							serviceOrderId: serviceOrderId.id,
							employeeId,
							uploadId: photo.uploadId,
							imageUrl: upload.url,
							fileName: upload.fileName,
							sizeInBytes: upload.sizeInBytes,
							contentType: upload.contentType,
							description: photo.description ?? null,
						};
					})
				);

				await tx
					.update(uploads)
					.set({ status: "completed" })
					.where(inArray(uploads.id, uploadIds));
			}

			const [serviceOrder] = await tx
				.select()
				.from(serviceOrders)
				.where(eq(serviceOrders.id, serviceOrderId.id))
				.limit(1);

			const photos = await tx
				.select()
				.from(serviceOrderImages)
				.where(eq(serviceOrderImages.serviceOrderId, serviceOrderId.id));

			return { serviceOrder, photos };
		});
	}
}
