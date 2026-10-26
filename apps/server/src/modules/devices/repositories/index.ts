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
import {
	customers,
	type DeviceInsert,
	devices,
	modelCategories,
	modelMakers,
	models,
	serviceOrders,
} from "@fixr/db/schema";
import type { deviceStatuses } from "@fixr/schemas/devices";
import type { z } from "zod";
import { InvalidateCache } from "../../../shared/infra/cache";

/** How many of the device's latest service orders the detail route returns. */
const RECENT_SERVICE_ORDERS = 20;

/** @description A device with its owner and catalog model, as lists and details show it */
export const deviceSelect = {
	id: devices.id,
	companyId: devices.companyId,
	customerId: devices.customerId,
	modelId: devices.modelId,
	imei: devices.imei,
	serialNumber: devices.serialNumber,
	notes: devices.notes,
	status: devices.status,
	createdAt: devices.createdAt,
	updatedAt: devices.updatedAt,
	deletedAt: devices.deletedAt,
	customer: {
		id: customers.id,
		name: customers.name,
		cpf: customers.cpf,
		phone: customers.phone,
	},
	model: { id: models.id, name: models.name, slug: models.slug },
	maker: { id: modelMakers.id, name: modelMakers.name },
	category: { id: modelCategories.id, name: modelCategories.name },
};

/** @description Joins behind `deviceSelect` */
export const deviceJoins = [
	{
		type: "inner" as const,
		table: customers,
		on: eq(customers.id, devices.customerId),
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

function joined() {
	return db
		.select(deviceSelect)
		.from(devices)
		.innerJoin(customers, eq(customers.id, devices.customerId))
		.innerJoin(models, eq(models.id, devices.modelId))
		.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
		.leftJoin(modelCategories, eq(modelCategories.id, models.categoryId));
}

/** @description Data access layer for the customers' devices */
export class DevicesRepository {
	/**
	 * WHERE clause for listing the company's active (not deleted) devices
	 *
	 * @param companyId - Tenant the devices belong to
	 * @param filters - Search on model, maker, owner, IMEI and serial number; owner and status filters
	 */
	static buildListFilter(
		companyId: string,
		filters: {
			query?: string;
			customerId?: string;
			status?: z.infer<typeof deviceStatuses>;
		}
	) {
		const conditions: SQL[] = [
			eq(devices.companyId, companyId),
			isNull(devices.deletedAt),
		];

		if (filters.customerId) {
			conditions.push(eq(devices.customerId, filters.customerId));
		}
		if (filters.status) {
			conditions.push(eq(devices.status, filters.status));
		}
		if (filters.query) {
			const pattern = `%${filters.query}%`;
			conditions.push(
				or(
					like(models.name, pattern),
					like(modelMakers.name, pattern),
					like(customers.name, pattern),
					like(devices.imei, pattern),
					like(devices.serialNumber, pattern)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "updated") {
		if (sort === "updated") {
			return [desc(devices.updatedAt), desc(devices.id)];
		}
		return sort === "older"
			? [asc(devices.createdAt), asc(devices.id)]
			: [desc(devices.createdAt), desc(devices.id)];
	}

	/** An active device of the company, with its owner and model. */
	static async queryDeviceOfCompany(deviceId: string, companyId: string) {
		const [device] = await joined()
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

	/** An active customer of the company. */
	static async queryCustomerOfCompany(customerId: string, companyId: string) {
		const [customer] = await db
			.select({ id: customers.id })
			.from(customers)
			.where(
				and(
					eq(customers.id, customerId),
					eq(customers.companyId, companyId),
					isNull(customers.deletedAt)
				)
			)
			.limit(1);
		return customer ?? null;
	}

	/** A model the company can use: from the shared catalog or its own. */
	static async queryModelForCompany(modelId: string, companyId: string) {
		const [model] = await db
			.select({ id: models.id })
			.from(models)
			.where(
				and(
					eq(models.id, modelId),
					or(isNull(models.companyId), eq(models.companyId, companyId))
				)
			)
			.limit(1);
		return model ?? null;
	}

	static async queryRecentServiceOrders(deviceId: string) {
		return await db
			.select({
				id: serviceOrders.id,
				status: serviceOrders.status,
				reportedDefect: serviceOrders.reportedDefect,
				createdAt: serviceOrders.createdAt,
			})
			.from(serviceOrders)
			.where(eq(serviceOrders.deviceId, deviceId))
			.orderBy(desc(serviceOrders.createdAt))
			.limit(RECENT_SERVICE_ORDERS);
	}

	static async insertDevice(values: DeviceInsert) {
		const [inserted] = await db.insert(devices).values(values).$returningId();
		return inserted.id;
	}

	// Service order lists and details show the device they point to.
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async updateDevice(deviceId: string, values: Partial<DeviceInsert>) {
		await db.update(devices).set(values).where(eq(devices.id, deviceId));
	}
}
