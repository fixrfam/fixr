import {
	and,
	db,
	eq,
	gte,
	inArray,
	isNull,
	like,
	lte,
	or,
	type SQL,
	type Transaction,
} from "@fixr/db/connection";
import {
	clients,
	devices,
	employees,
	modelCategories,
	modelMakers,
	models,
	parts,
	serviceOrderImages,
	serviceOrderItems,
	serviceOrders,
	services,
	uploads,
} from "@fixr/db/schema";
import type {
	createServiceOrderSchema,
	getServiceOrdersQuerySchema,
	serviceOrderItemTypes,
	serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type ServiceOrderItemInsert = typeof serviceOrderItems.$inferInsert;

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
	deviceId: serviceOrders.deviceId,
	reportedDefect: serviceOrders.reportedDefect,
	observations: serviceOrders.observations,
	status: serviceOrders.status,
	createdAt: serviceOrders.createdAt,
	updatedAt: serviceOrders.updatedAt,
	client: {
		id: clients.id,
		name: clients.name,
		cpf: clients.cpf,
		phone: clients.phone,
		email: clients.email,
	},
	employee: { id: employees.id, name: employees.name },
	device: {
		id: devices.id,
		imei: devices.imei,
		serialNumber: devices.serialNumber,
		status: devices.status,
	},
	model: { id: models.id, name: models.name, slug: models.slug },
	deviceMaker: { id: modelMakers.id, name: modelMakers.name },
	deviceCategory: { id: modelCategories.id, name: modelCategories.name },
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
		table: devices,
		on: eq(devices.id, serviceOrders.deviceId),
	},
	{
		type: "inner" as const,
		table: models,
		on: eq(models.id, devices.modelId),
	},
	{
		type: "inner" as const,
		table: modelMakers,
		on: eq(modelMakers.id, models.makerId),
	},
	{
		type: "left" as const,
		table: modelCategories,
		on: eq(modelCategories.id, models.categoryId),
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

	/** An active device of the company, with its owner. */
	static async queryDeviceOfCompany(deviceId: string, companyId: string) {
		const [device] = await db
			.select({ id: devices.id, clientId: devices.clientId })
			.from(devices)
			.where(
				and(
					eq(devices.id, deviceId),
					eq(devices.companyId, companyId),
					isNull(devices.deletedAt)
				)
			)
			.limit(1);
		return device ?? null;
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
			conditions.push(eq(models.categoryId, filters.deviceCategoryId));
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
					like(models.name, `%${filters.query}%`),
					like(modelMakers.name, `%${filters.query}%`),
					like(devices.imei, `%${filters.query}%`),
					like(serviceOrders.reportedDefect, `%${filters.query}%`),
					like(clients.name, `%${filters.query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	/** Insert the order and its photos. Runs in the caller's transaction, which also emits `serviceOrder.opened`. */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async createWithPhotos(
		tx: Transaction,
		{
			companyId,
			employeeId,
			clientId,
			data,
		}: {
			companyId: string;
			employeeId: string;
			clientId: string;
			data: z.infer<typeof createServiceOrderSchema>;
		}
	) {
		const [serviceOrderId] = await tx
			.insert(serviceOrders)
			.values({
				companyId,
				clientId,
				employeeId,
				deviceId: data.deviceId,
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
	}

	/** One order of the company with its customer, device, technician and photos. */
	static async queryServiceOrderDetail(
		serviceOrderId: string,
		companyId: string
	) {
		const [serviceOrder] = await db
			.select(serviceOrdersListSelect)
			.from(serviceOrders)
			.innerJoin(clients, eq(clients.id, serviceOrders.clientId))
			.innerJoin(employees, eq(employees.id, serviceOrders.employeeId))
			.innerJoin(devices, eq(devices.id, serviceOrders.deviceId))
			.innerJoin(models, eq(models.id, devices.modelId))
			.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
			.leftJoin(modelCategories, eq(modelCategories.id, models.categoryId))
			.where(
				and(
					eq(serviceOrders.id, serviceOrderId),
					eq(serviceOrders.companyId, companyId)
				)
			)
			.limit(1);

		if (!serviceOrder) {
			return null;
		}

		const photos = await db
			.select()
			.from(serviceOrderImages)
			.where(eq(serviceOrderImages.serviceOrderId, serviceOrderId));

		return { ...serviceOrder, photos };
	}

	static async updateServiceOrder(
		serviceOrderId: string,
		values: Partial<typeof serviceOrders.$inferInsert>
	) {
		await db
			.update(serviceOrders)
			.set(values)
			.where(eq(serviceOrders.id, serviceOrderId));
	}

	/** Set the order's status. Runs in the caller's transaction, which also emits `serviceOrder.statusChanged`. */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async updateStatus(
		tx: Transaction,
		serviceOrderId: string,
		status: z.infer<typeof serviceOrderStatuses>
	) {
		await tx
			.update(serviceOrders)
			.set({ status })
			.where(eq(serviceOrders.id, serviceOrderId));
	}

	static async queryServiceOrderOfCompany(
		serviceOrderId: string,
		companyId: string
	) {
		const [serviceOrder] = await db
			.select({
				id: serviceOrders.id,
				deviceId: serviceOrders.deviceId,
				status: serviceOrders.status,
			})
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

	static async queryItems(serviceOrderId: string) {
		return await db
			.select()
			.from(serviceOrderItems)
			.where(eq(serviceOrderItems.serviceOrderId, serviceOrderId))
			// `created_at` has second precision: the id keeps items added in the
			// same second in a stable (if arbitrary) order.
			.orderBy(serviceOrderItems.createdAt, serviceOrderItems.id);
	}

	static async queryItem(serviceOrderId: string, itemId: string) {
		const [item] = await db
			.select()
			.from(serviceOrderItems)
			.where(
				and(
					eq(serviceOrderItems.id, itemId),
					eq(serviceOrderItems.serviceOrderId, serviceOrderId)
				)
			)
			.limit(1);
		return item ?? null;
	}

	/** Name and current sale price of a catalog part or service of the company. */
	static async queryCatalogItem(
		type: z.infer<typeof serviceOrderItemTypes>,
		itemId: string,
		companyId: string
	) {
		const table = type === "part" ? parts : services;
		const price = type === "part" ? parts.salePrice : services.price;
		const [item] = await db
			.select({ id: table.id, name: table.name, price })
			.from(table)
			.where(and(eq(table.id, itemId), eq(table.companyId, companyId)))
			.limit(1);
		return item ?? null;
	}

	static async insertItem(values: ServiceOrderItemInsert) {
		await db.insert(serviceOrderItems).values(values);
	}

	static async updateItem(
		itemId: string,
		values: Partial<ServiceOrderItemInsert>
	) {
		await db
			.update(serviceOrderItems)
			.set(values)
			.where(eq(serviceOrderItems.id, itemId));
	}

	static async deleteItem(itemId: string) {
		await db.delete(serviceOrderItems).where(eq(serviceOrderItems.id, itemId));
	}
}
