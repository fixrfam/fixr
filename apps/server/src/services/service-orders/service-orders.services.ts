import { db, eq } from "@fixr/db/connection";
import {
	clients,
	deviceBrands,
	deviceCategories,
	employees,
	serviceOrderPhotos,
	serviceOrders,
} from "@fixr/db/schema";
import type { createServiceOrderMockSchema } from "@fixr/schemas/service-orders";
import type { z } from "zod";

export async function getEmployeeByUserId(userId: string) {
	const [employee] = await db
		.select()
		.from(employees)
		.where(eq(employees.userId, userId))
		.limit(1);

	return employee ?? null;
}

export async function getClientById(clientId: string) {
	const [client] = await db
		.select()
		.from(clients)
		.where(eq(clients.id, clientId))
		.limit(1);

	return client ?? null;
}

export async function getDeviceBrandById(deviceBrandId: string) {
	const [brand] = await db
		.select()
		.from(deviceBrands)
		.where(eq(deviceBrands.id, deviceBrandId))
		.limit(1);

	return brand ?? null;
}

export async function getDeviceCategoryById(deviceCategoryId: string) {
	const [category] = await db
		.select()
		.from(deviceCategories)
		.where(eq(deviceCategories.id, deviceCategoryId))
		.limit(1);

	return category ?? null;
}

export async function createServiceOrderWithPhotos({
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
				deviceBrandId: data.deviceBrandId,
				deviceCategoryId: data.deviceCategoryId,
				deviceModel: data.deviceModel,
				imei: data.imei ?? null,
				reportedDefect: data.reportedDefect,
				observations: data.observations ?? null,
			})
			.$returningId();

		if (data.photos.length > 0) {
			await tx.insert(serviceOrderPhotos).values(
				data.photos.map((photo) => ({
					serviceOrderId: serviceOrderId.id,
					employeeId,
					photoUrl: photo.url,
					fileName: photo.fileName,
					sizeInBytes: photo.size,
					contentType: photo.contentType,
					description: photo.description ?? null,
				}))
			);
		}

		const [serviceOrder] = await tx
			.select()
			.from(serviceOrders)
			.where(eq(serviceOrders.id, serviceOrderId.id))
			.limit(1);

		const photos = await tx
			.select()
			.from(serviceOrderPhotos)
			.where(eq(serviceOrderPhotos.serviceOrderId, serviceOrderId.id));

		return { serviceOrder, photos };
	});
}
