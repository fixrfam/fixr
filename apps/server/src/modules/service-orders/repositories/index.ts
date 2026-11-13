import {
	alias,
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
	sql,
	type Transaction,
} from "@fixr/db/connection";
import {
	customers,
	devices,
	employees,
	modelCategories,
	modelMakers,
	models,
	parts,
	sectors,
	serviceOrderAssignments,
	serviceOrderHistory,
	serviceOrderImages,
	serviceOrderItems,
	serviceOrderSequences,
	serviceOrders,
	serviceParts,
	services,
	uploads,
} from "@fixr/db/schema";
import {
	type createServiceOrderPhotoSchema,
	type createServiceOrderSchema,
	type getServiceOrdersQuerySchema,
	parseServiceOrderNumber,
	type serviceOrderItemTypes,
	type serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { modelImageKey } from "../../../core/lib/model-image";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;
type PhotoInput = z.infer<typeof createServiceOrderPhotoSchema>;

export type ServiceOrderItemInsert = typeof serviceOrderItems.$inferInsert;

function endOfDay(date: Date) {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

/** The employee responsible for an order now (`employees` is who opened it). */
const assignees = alias(employees, "assignees");

export const serviceOrdersListSelect = {
	id: serviceOrders.id,
	number: serviceOrders.number,
	companyId: serviceOrders.companyId,
	customerId: serviceOrders.customerId,
	employeeId: serviceOrders.employeeId,
	sectorId: serviceOrders.sectorId,
	assigneeId: serviceOrders.assigneeId,
	deviceId: serviceOrders.deviceId,
	reportedDefect: serviceOrders.reportedDefect,
	observations: serviceOrders.observations,
	status: serviceOrders.status,
	createdAt: serviceOrders.createdAt,
	updatedAt: serviceOrders.updatedAt,
	customer: {
		id: customers.id,
		name: customers.name,
		cpf: customers.cpf,
		phone: customers.phone,
		email: customers.email,
	},
	employee: { id: employees.id, name: employees.name },
	sector: { id: sectors.id, name: sectors.name },
	assignee: { id: assignees.id, name: assignees.name },
	device: {
		id: devices.id,
		imei: devices.imei,
		serialNumber: devices.serialNumber,
		status: devices.status,
	},
	model: {
		id: models.id,
		name: models.name,
		slug: models.slug,
		imageKey: modelImageKey,
	},
	deviceMaker: { id: modelMakers.id, name: modelMakers.name },
	deviceCategory: {
		id: modelCategories.id,
		name: modelCategories.name,
		slug: modelCategories.slug,
	},
};

export const serviceOrdersListJoins = [
	{
		type: "inner" as const,
		table: customers,
		on: eq(customers.id, serviceOrders.customerId),
	},
	{
		type: "inner" as const,
		table: employees,
		on: eq(employees.id, serviceOrders.employeeId),
	},
	{
		type: "left" as const,
		table: sectors,
		on: eq(sectors.id, serviceOrders.sectorId),
	},
	{
		type: "left" as const,
		table: assignees,
		on: eq(assignees.id, serviceOrders.assigneeId),
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
			.select({ id: devices.id, customerId: devices.customerId })
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

	/**
	 * @param viewer - the caller, for the `mine` (assigned to them) and
	 * `sector` (their sector's pool) scopes
	 */
	static buildListFilter(
		companyId: string,
		filters: Pick<
			z.infer<typeof getServiceOrdersQuerySchema>,
			| "query"
			| "deviceCategoryId"
			| "employeeId"
			| "scope"
			| "sectorId"
			| "status"
			| "dateFrom"
			| "dateTo"
		>,
		viewer?: { id: string; sectorId: string | null }
	) {
		const conditions: SQL[] = [eq(serviceOrders.companyId, companyId)];

		if (filters.scope === "mine" && viewer) {
			conditions.push(eq(serviceOrders.assigneeId, viewer.id));
		}
		if (filters.scope === "sector" && viewer) {
			// No sector, no pool: an employee outside every sector sees nothing here.
			conditions.push(
				viewer.sectorId
					? eq(serviceOrders.sectorId, viewer.sectorId)
					: sql`false`
			);
		}
		if (filters.sectorId) {
			conditions.push(eq(serviceOrders.sectorId, filters.sectorId));
		}

		if (filters.deviceCategoryId) {
			conditions.push(eq(models.categoryId, filters.deviceCategoryId));
		}
		if (filters.employeeId) {
			conditions.push(eq(serviceOrders.assigneeId, filters.employeeId));
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
			// `ACME-12`, `#12` or `12` also find order number 12.
			const number = parseServiceOrderNumber(filters.query);
			conditions.push(
				or(
					...(number === null ? [] : [eq(serviceOrders.number, number)]),
					like(models.name, `%${filters.query}%`),
					like(modelMakers.name, `%${filters.query}%`),
					like(devices.imei, `%${filters.query}%`),
					like(serviceOrders.reportedDefect, `%${filters.query}%`),
					like(customers.name, `%${filters.query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	/** Uploads of service order photos that belong to the company and aren't attached yet. */
	static async queryPhotoUploads(uploadIds: string[], companyId: string) {
		return await db
			.select({ id: uploads.id })
			.from(uploads)
			.where(
				and(
					inArray(uploads.id, uploadIds),
					eq(uploads.companyId, companyId),
					eq(uploads.purpose, "service_order"),
					eq(uploads.status, "pending")
				)
			);
	}

	/**
	 * The company's next order number. The upsert locks the company's row of
	 * the sequence until the transaction ends, so concurrent orders queue up
	 * instead of sharing a number.
	 */
	static async nextNumber(tx: Transaction, companyId: string) {
		await tx
			.insert(serviceOrderSequences)
			.values({ companyId, lastNumber: 1 })
			.onDuplicateKeyUpdate({
				set: { lastNumber: sql`${serviceOrderSequences.lastNumber} + 1` },
			});
		const [sequence] = await tx
			.select({ lastNumber: serviceOrderSequences.lastNumber })
			.from(serviceOrderSequences)
			.where(eq(serviceOrderSequences.companyId, companyId))
			.limit(1);
		return sequence.lastNumber;
	}

	/** Insert the order, its first history entry and its photos. Runs in the caller's transaction, which also emits `serviceOrder.opened`. */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async create(
		tx: Transaction,
		{
			companyId,
			employeeId,
			sectorId,
			customerId,
			data,
		}: {
			companyId: string;
			employeeId: string;
			/** The opener's sector: the order starts in their pool, assigned to them. */
			sectorId: string | null;
			customerId: string;
			data: z.infer<typeof createServiceOrderSchema>;
		}
	) {
		const number = await ServiceOrdersRepository.nextNumber(tx, companyId);
		const [{ id }] = await tx
			.insert(serviceOrders)
			.values({
				companyId,
				number,
				customerId,
				employeeId,
				sectorId,
				assigneeId: employeeId,
				deviceId: data.deviceId,
				reportedDefect: data.reportedDefect,
				observations: data.observations ?? null,
			})
			.$returningId();

		await ServiceOrdersRepository.insertStatusHistory(tx, {
			serviceOrderId: id,
			fromStatus: null,
			toStatus: "pending",
			employeeId,
		});
		await ServiceOrdersRepository.insertPhotos(tx, {
			serviceOrderId: id,
			employeeId,
			photos: data.photos,
		});

		return { id, number };
	}

	/** Attach uploaded photos to an order and mark the uploads as used. */
	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async insertPhotos(
		tx: Transaction,
		{
			serviceOrderId,
			employeeId,
			photos,
		}: { serviceOrderId: string; employeeId: string; photos: PhotoInput[] }
	) {
		if (photos.length === 0) {
			return;
		}
		await tx.insert(serviceOrderImages).values(
			photos.map((photo) => ({
				serviceOrderId,
				employeeId,
				uploadId: photo.uploadId,
				description: photo.description ?? null,
			}))
		);
		await tx
			.update(uploads)
			.set({ status: "completed" })
			.where(
				inArray(
					uploads.id,
					photos.map((photo) => photo.uploadId)
				)
			);
	}

	static async queryPhoto(serviceOrderId: string, photoId: string) {
		const [photo] = await db
			.select({ id: serviceOrderImages.id })
			.from(serviceOrderImages)
			.where(
				and(
					eq(serviceOrderImages.id, photoId),
					eq(serviceOrderImages.serviceOrderId, serviceOrderId)
				)
			)
			.limit(1);
		return photo ?? null;
	}

	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async deletePhoto(photoId: string) {
		await db
			.delete(serviceOrderImages)
			.where(eq(serviceOrderImages.id, photoId));
	}

	/** Record a status the order went through. Runs in the transaction that moved it. */
	static async insertStatusHistory(
		tx: Transaction,
		values: {
			serviceOrderId: string;
			fromStatus: ServiceOrderStatus | null;
			toStatus: ServiceOrderStatus;
			employeeId?: string | null;
			note?: string | null;
		}
	) {
		await tx.insert(serviceOrderHistory).values({
			...values,
			employeeId: values.employeeId ?? null,
			note: values.note || null,
		});
	}

	/** One order of the company with its customer, device, technician and photos. */
	static async queryServiceOrderDetail(
		serviceOrderId: string,
		companyId: string
	) {
		const [serviceOrder] = await db
			.select(serviceOrdersListSelect)
			.from(serviceOrders)
			.innerJoin(customers, eq(customers.id, serviceOrders.customerId))
			.innerJoin(employees, eq(employees.id, serviceOrders.employeeId))
			.leftJoin(sectors, eq(sectors.id, serviceOrders.sectorId))
			.leftJoin(assignees, eq(assignees.id, serviceOrders.assigneeId))
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

		const [photos, history, assignments] = await Promise.all([
			db
				.select({
					id: serviceOrderImages.id,
					imageUrl: uploads.url,
					fileName: uploads.fileName,
					description: serviceOrderImages.description,
					createdAt: serviceOrderImages.createdAt,
				})
				.from(serviceOrderImages)
				.innerJoin(uploads, eq(uploads.id, serviceOrderImages.uploadId))
				.where(eq(serviceOrderImages.serviceOrderId, serviceOrderId))
				.orderBy(serviceOrderImages.createdAt, serviceOrderImages.id),
			db
				.select({
					id: serviceOrderHistory.id,
					from: serviceOrderHistory.fromStatus,
					to: serviceOrderHistory.toStatus,
					note: serviceOrderHistory.note,
					createdAt: serviceOrderHistory.createdAt,
					employee: { id: employees.id, name: employees.name },
				})
				.from(serviceOrderHistory)
				.leftJoin(employees, eq(employees.id, serviceOrderHistory.employeeId))
				.where(eq(serviceOrderHistory.serviceOrderId, serviceOrderId))
				// The opening first, even when a backfilled change shares its time.
				.orderBy(
					serviceOrderHistory.createdAt,
					sql`${serviceOrderHistory.fromStatus} IS NOT NULL`,
					serviceOrderHistory.id
				),
			ServiceOrdersRepository.queryAssignmentHistory(serviceOrderId),
		]);

		return { ...serviceOrder, photos, history, assignments };
	}

	/** Every reassignment of the order, oldest first, with the names of who and what. */
	static async queryAssignmentHistory(serviceOrderId: string) {
		const fromSector = alias(sectors, "from_sector");
		const toSector = alias(sectors, "to_sector");
		const fromAssignee = alias(employees, "from_assignee");
		const toAssignee = alias(employees, "to_assignee");

		return await db
			.select({
				id: serviceOrderAssignments.id,
				createdAt: serviceOrderAssignments.createdAt,
				fromSector: { id: fromSector.id, name: fromSector.name },
				toSector: { id: toSector.id, name: toSector.name },
				fromAssignee: { id: fromAssignee.id, name: fromAssignee.name },
				toAssignee: { id: toAssignee.id, name: toAssignee.name },
				employee: { id: employees.id, name: employees.name },
			})
			.from(serviceOrderAssignments)
			.leftJoin(
				fromSector,
				eq(fromSector.id, serviceOrderAssignments.fromSectorId)
			)
			.leftJoin(toSector, eq(toSector.id, serviceOrderAssignments.toSectorId))
			.leftJoin(
				fromAssignee,
				eq(fromAssignee.id, serviceOrderAssignments.fromAssigneeId)
			)
			.leftJoin(
				toAssignee,
				eq(toAssignee.id, serviceOrderAssignments.toAssigneeId)
			)
			.leftJoin(employees, eq(employees.id, serviceOrderAssignments.employeeId))
			.where(eq(serviceOrderAssignments.serviceOrderId, serviceOrderId))
			.orderBy(serviceOrderAssignments.createdAt, serviceOrderAssignments.id);
	}

	/** The order's sector and assignee, locked until the transaction ends. */
	static async queryAssignmentForUpdate(
		tx: Transaction,
		serviceOrderId: string
	) {
		const [serviceOrder] = await tx
			.select({
				sectorId: serviceOrders.sectorId,
				assigneeId: serviceOrders.assigneeId,
			})
			.from(serviceOrders)
			.where(eq(serviceOrders.id, serviceOrderId))
			.limit(1)
			.for("update");
		return serviceOrder ?? null;
	}

	@InvalidateCache({ patterns: ["service-orders:*"] })
	static async updateAssignment(
		tx: Transaction,
		serviceOrderId: string,
		values: { sectorId: string | null; assigneeId: string | null }
	) {
		await tx
			.update(serviceOrders)
			.set(values)
			.where(eq(serviceOrders.id, serviceOrderId));
	}

	/** Record a reassignment. Runs in the transaction that made it. */
	static async insertAssignmentHistory(
		tx: Transaction,
		values: typeof serviceOrderAssignments.$inferInsert
	) {
		await tx.insert(serviceOrderAssignments).values(values);
	}

	/** A sector of the company. */
	static async querySectorOfCompany(sectorId: string, companyId: string) {
		const [sector] = await db
			.select({ id: sectors.id })
			.from(sectors)
			.where(and(eq(sectors.id, sectorId), eq(sectors.companyId, companyId)))
			.limit(1);
		return sector ?? null;
	}

	/** An employee of the company, with their sector. */
	static async queryEmployeeOfCompany(employeeId: string, companyId: string) {
		const [employee] = await db
			.select({ id: employees.id, sectorId: employees.sectorId })
			.from(employees)
			.where(
				and(eq(employees.id, employeeId), eq(employees.companyId, companyId))
			)
			.limit(1);
		return employee ?? null;
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

	/** The order's status, locked until the transaction ends so two changes can't interleave. */
	static async queryStatusForUpdate(tx: Transaction, serviceOrderId: string) {
		const [serviceOrder] = await tx
			.select({
				companyId: serviceOrders.companyId,
				deviceId: serviceOrders.deviceId,
				status: serviceOrders.status,
			})
			.from(serviceOrders)
			.where(eq(serviceOrders.id, serviceOrderId))
			.limit(1)
			.for("update");
		return serviceOrder ?? null;
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

	static async insertItem(
		values: ServiceOrderItemInsert,
		executor: Transaction | typeof db = db
	) {
		const [{ id }] = await executor
			.insert(serviceOrderItems)
			.values(values)
			.$returningId();
		return id;
	}

	/** Parts of the company a catalog service uses, with their current sale price. */
	static async queryServiceParts(serviceId: string, companyId: string) {
		return await db
			.select({ id: parts.id, name: parts.name, price: parts.salePrice })
			.from(serviceParts)
			.innerJoin(parts, eq(parts.id, serviceParts.partId))
			.where(
				and(
					eq(serviceParts.serviceId, serviceId),
					eq(parts.companyId, companyId)
				)
			)
			.orderBy(parts.name);
	}

	/** Part lines of the order that don't belong to a service yet, for the given parts. */
	static async queryLoosePartItems(
		tx: Transaction,
		serviceOrderId: string,
		partIds: string[]
	) {
		if (partIds.length === 0) {
			return [];
		}
		return await tx
			.select()
			.from(serviceOrderItems)
			.where(
				and(
					eq(serviceOrderItems.serviceOrderId, serviceOrderId),
					eq(serviceOrderItems.type, "part"),
					isNull(serviceOrderItems.parentItemId),
					inArray(serviceOrderItems.partId, partIds)
				)
			)
			.orderBy(serviceOrderItems.createdAt, serviceOrderItems.id);
	}

	static async updateItem(
		itemId: string,
		values: Partial<ServiceOrderItemInsert>,
		executor: Transaction | typeof db = db
	) {
		await executor
			.update(serviceOrderItems)
			.set(values)
			.where(eq(serviceOrderItems.id, itemId));
	}

	/** Delete the line and, for a service, the parts under it. */
	static async deleteItem(itemId: string) {
		await db
			.delete(serviceOrderItems)
			.where(
				or(
					eq(serviceOrderItems.id, itemId),
					eq(serviceOrderItems.parentItemId, itemId)
				)
			);
	}
}
