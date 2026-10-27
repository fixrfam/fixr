import { db, eq, sql } from "@fixr/db/connection";
import { devices, serviceOrderSequences, serviceOrders } from "@fixr/db/schema";
import type { deviceStatuses } from "@fixr/schemas/devices";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { makeMaker, makeModel } from "./device";

/** A customer's device. Without `modelId`, a company model of `makerId` (or a new maker) is created. */
export async function makeDevice(input: {
	companyId: string;
	clientId: string;
	modelId?: string;
	makerId?: string;
	categoryId?: string | null;
	modelName?: string;
	imei?: string | null;
	serialNumber?: string | null;
	status?: z.infer<typeof deviceStatuses>;
	deletedAt?: Date | null;
}) {
	const modelId =
		input.modelId ??
		(
			await makeModel({
				makerId: input.makerId ?? (await makeMaker()).id,
				companyId: input.companyId,
				categoryId: input.categoryId ?? null,
				name: input.modelName,
			})
		).id;

	const device = {
		id: createId(),
		companyId: input.companyId,
		clientId: input.clientId,
		modelId,
		imei: input.imei ?? null,
		serialNumber: input.serialNumber ?? null,
		status: input.status ?? "with_customer",
		deletedAt: input.deletedAt ?? null,
	};

	await db.insert(devices).values(device);

	return device;
}

/**
 * A service order. Without `deviceId`, a device of the client is created
 * (its model from `deviceMakerId`, `deviceCategoryId` and `deviceModel`).
 */
export async function makeServiceOrder(input: {
	companyId: string;
	clientId: string;
	employeeId: string;
	deviceId?: string;
	deviceMakerId?: string;
	deviceCategoryId?: string;
	deviceModel?: string;
	status?: z.infer<typeof serviceOrderStatuses>;
	createdAt?: Date;
}) {
	const deviceId =
		input.deviceId ??
		(
			await makeDevice({
				companyId: input.companyId,
				clientId: input.clientId,
				makerId: input.deviceMakerId,
				categoryId: input.deviceCategoryId,
				modelName: input.deviceModel,
			})
		).id;

	// Same sequence the API uses, so orders made here and through it never collide.
	await db
		.insert(serviceOrderSequences)
		.values({ companyId: input.companyId, lastNumber: 1 })
		.onDuplicateKeyUpdate({
			set: { lastNumber: sql`${serviceOrderSequences.lastNumber} + 1` },
		});
	const [{ lastNumber }] = await db
		.select({ lastNumber: serviceOrderSequences.lastNumber })
		.from(serviceOrderSequences)
		.where(eq(serviceOrderSequences.companyId, input.companyId));

	const serviceOrder = {
		id: createId(),
		number: lastNumber,
		companyId: input.companyId,
		clientId: input.clientId,
		employeeId: input.employeeId,
		deviceId,
		reportedDefect: "Tela quebrada",
		status: input.status ?? "pending",
		...(input.createdAt ? { createdAt: input.createdAt } : {}),
	};

	await db.insert(serviceOrders).values(serviceOrder);

	return serviceOrder;
}
