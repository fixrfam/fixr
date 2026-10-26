import { asc, db, desc, inArray } from "@fixr/db/connection";
import { serviceOrders as serviceOrdersTable, uploads } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	addServiceOrderItemSchema,
	changeServiceOrderStatusSchema,
	createServiceOrderSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderItemSchema,
	patchServiceOrderSchema,
} from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { events } from "../../../core/events";
import { AppError } from "../../../core/lib/app-error";
import { itemTotals, lineTotal } from "../../../core/lib/money";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { inTransaction } from "../../../core/lib/transaction";
import {
	ServiceOrdersRepository,
	serviceOrdersListJoins,
	serviceOrdersListSelect,
} from "../repositories";
import { moveServiceOrder } from "./move-status";

export class ServiceOrdersService {
	static async getCompanyServiceOrders({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		deviceCategoryId,
		employeeId,
		status,
		dateFrom,
		dateTo,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getServiceOrdersQuerySchema>) {
		if (!userJwt.company) {
			throw new AppError("SERVICE_ORDER_COMPANY_NOT_FOUND");
		}

		const companyId = userJwt.company.id;

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SERVICE_ORDER_NOT_ALLOWED");
		}

		const PER_PAGE = perPage ?? 10;

		const order =
			sort === "newer" || !sort
				? desc(serviceOrdersTable.createdAt)
				: asc(serviceOrdersTable.createdAt);

		const filter = ServiceOrdersRepository.buildListFilter(companyId, {
			query,
			deviceCategoryId,
			employeeId,
			status,
			dateFrom,
			dateTo,
		});

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: serviceOrdersTable,
				select: serviceOrdersListSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order,
				joins: serviceOrdersListJoins,
			}),
			getPaginatedCount({
				table: serviceOrdersTable,
				where: filter,
				// Search and the category filter read joined tables.
				joins: serviceOrdersListJoins,
			}),
		]);

		if (totalRecords === 0) {
			return response.status(200).send(
				apiResponse({
					status: 200,
					error: null,
					message: "Company service orders successfully retrieved.",
					code: "get_company_service_orders_success",
					data: paginatedData({
						records: [],
						pagination: {
							total_records: 0,
							total_pages: 0,
							current_page: 1,
							next_page: null,
							prev_page: null,
						},
					}),
				})
			);
		}

		const total_pages = Math.ceil(totalRecords / PER_PAGE);

		if (page > total_pages) {
			throw new AppError("SERVICE_ORDER_PAGE_OUT_OF_BOUNDS");
		}

		const next_page =
			PER_PAGE * (page - 1) + records.length < totalRecords ? page + 1 : null;

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				message: "Company service orders successfully retrieved.",
				code: "get_company_service_orders_success",
				data: paginatedData({
					records,
					pagination: {
						total_records: totalRecords,
						total_pages,
						current_page: page,
						next_page,
						prev_page: page > 1 ? page - 1 : null,
					},
				}),
			})
		);
	}

	static async createServiceOrder({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createServiceOrderSchema>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("SERVICE_ORDER_COMPANY_NOT_FOUND");
		}

		const companyId = userJwt.company.id;

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SERVICE_ORDER_NOT_ALLOWED");
		}

		const employee = await ServiceOrdersRepository.queryEmployeeByUserId(
			userJwt.id
		);

		if (!employee || employee.companyId !== companyId) {
			throw new AppError("SERVICE_ORDER_EMPLOYEE_NOT_FOUND");
		}

		// Devices are company-scoped: another company's (or a deleted) device doesn't exist here.
		const device = await ServiceOrdersRepository.queryDeviceOfCompany(
			data.deviceId,
			companyId
		);
		if (!device) {
			throw new AppError("SERVICE_ORDER_DEVICE_NOT_FOUND");
		}

		if (data.photos.length > 0) {
			const uploadIds = data.photos.map((p) => p.uploadId);
			const foundUploads = await db
				.select()
				.from(uploads)
				.where(inArray(uploads.id, uploadIds));

			const foundMap = new Map(foundUploads.map((u) => [u.id, u]));

			for (const uploadId of uploadIds) {
				const upload = foundMap.get(uploadId);
				if (!upload || upload.companyId !== companyId) {
					throw new AppError("SERVICE_ORDER_UPLOAD_NOT_FOUND");
				}
			}
		}

		const { serviceOrder, photos } = await inTransaction(async (tx) => {
			const created = await ServiceOrdersRepository.createWithPhotos(tx, {
				companyId,
				employeeId: employee.id,
				clientId: device.clientId,
				data,
			});
			await events.emit(tx, "serviceOrder.opened", {
				serviceOrderId: created.serviceOrder.id,
				companyId,
				deviceId: device.id,
				employeeId: employee.id,
			});
			return created;
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_service_order_success",
				message: "Service order created successfully.",
				data: {
					...serviceOrder,
					photos,
				},
			})
		);
	}

	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(
		userJwt: z.infer<typeof jwtPayload>,
		subdomain: string
	) {
		if (!userJwt.company) {
			throw new AppError("SERVICE_ORDER_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SERVICE_ORDER_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	private static async assertOwnServiceOrder(
		serviceOrderId: string,
		companyId: string
	) {
		const serviceOrder =
			await ServiceOrdersRepository.queryServiceOrderOfCompany(
				serviceOrderId,
				companyId
			);
		if (!serviceOrder) {
			throw new AppError("SERVICE_ORDER_NOT_FOUND");
		}
		return serviceOrder;
	}

	private static async queryDetail(serviceOrderId: string, companyId: string) {
		const serviceOrder = await ServiceOrdersRepository.queryServiceOrderDetail(
			serviceOrderId,
			companyId
		);
		if (!serviceOrder) {
			throw new AppError("SERVICE_ORDER_NOT_FOUND");
		}
		return serviceOrder;
	}

	static async getServiceOrder({
		userJwt,
		subdomain,
		serviceOrderId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_service_order_success",
				message: "Service order retrieved successfully.",
				data: await ServiceOrdersService.queryDetail(serviceOrderId, companyId),
			})
		);
	}

	/** Edit the reported issue and the notes. */
	static async patchServiceOrder({
		userJwt,
		subdomain,
		serviceOrderId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		data: z.infer<typeof patchServiceOrderSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		if (Object.keys(data).length > 0) {
			await ServiceOrdersRepository.updateServiceOrder(serviceOrderId, data);
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_service_order_success",
				message: "Service order updated successfully.",
				data: await ServiceOrdersService.queryDetail(serviceOrderId, companyId),
			})
		);
	}

	/**
	 * Move the order to another status and emit `serviceOrder.statusChanged`,
	 * whose effects (e.g. the device following the order) run in the same
	 * transaction. Setting the current status again changes nothing.
	 */
	static async changeStatus({
		userJwt,
		subdomain,
		serviceOrderId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		data: z.infer<typeof changeServiceOrderStatusSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		await inTransaction((tx) =>
			moveServiceOrder(
				tx,
				(event, payload) => events.emit(tx, event, payload),
				{
					serviceOrderId,
					to: data.status,
				}
			)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "change_service_order_status_success",
				message: "Service order status updated successfully.",
				data: await ServiceOrdersService.queryDetail(serviceOrderId, companyId),
			})
		);
	}

	/** The order's items with their line totals, plus subtotals per type and the total. */
	private static async itemsWithTotals(serviceOrderId: string) {
		const items = await ServiceOrdersRepository.queryItems(serviceOrderId);
		return {
			items: items.map((item) => ({ ...item, total: lineTotal(item) })),
			totals: itemTotals(items),
		};
	}

	private static sendItems(
		response: FastifyReply,
		{
			status,
			code,
			message,
			data,
		}: {
			status: 200 | 201;
			code: string;
			message: string;
			data: Awaited<ReturnType<typeof ServiceOrdersService.itemsWithTotals>>;
		}
	) {
		return response
			.status(status)
			.send(apiResponse({ status, error: null, code, message, data }));
	}

	static async listItems({
		userJwt,
		subdomain,
		serviceOrderId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		return ServiceOrdersService.sendItems(response, {
			status: 200,
			code: "list_service_order_items_success",
			message: "Service order items retrieved successfully.",
			data: await ServiceOrdersService.itemsWithTotals(serviceOrderId),
		});
	}

	/** Add a catalog part or service, snapshotting its name and (by default) its current price. */
	static async addItem({
		userJwt,
		subdomain,
		serviceOrderId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		data: z.infer<typeof addServiceOrderItemSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		const catalogItem = await ServiceOrdersRepository.queryCatalogItem(
			data.type,
			data.itemId,
			companyId
		);
		if (!catalogItem) {
			throw new AppError("SERVICE_ORDER_CATALOG_ITEM_NOT_FOUND");
		}

		await ServiceOrdersRepository.insertItem({
			serviceOrderId,
			type: data.type,
			partId: data.type === "part" ? catalogItem.id : null,
			serviceId: data.type === "service" ? catalogItem.id : null,
			name: catalogItem.name,
			quantity: data.quantity,
			unitPrice: data.unitPrice ?? catalogItem.price,
		});

		return ServiceOrdersService.sendItems(response, {
			status: 201,
			code: "add_service_order_item_success",
			message: "Item added to the service order.",
			data: await ServiceOrdersService.itemsWithTotals(serviceOrderId),
		});
	}

	static async patchItem({
		userJwt,
		subdomain,
		serviceOrderId,
		itemId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		itemId: string;
		data: z.infer<typeof patchServiceOrderItemSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		const item = await ServiceOrdersRepository.queryItem(
			serviceOrderId,
			itemId
		);
		if (!item) {
			throw new AppError("SERVICE_ORDER_ITEM_NOT_FOUND");
		}

		if (Object.keys(data).length > 0) {
			await ServiceOrdersRepository.updateItem(itemId, data);
		}

		return ServiceOrdersService.sendItems(response, {
			status: 200,
			code: "patch_service_order_item_success",
			message: "Service order item updated.",
			data: await ServiceOrdersService.itemsWithTotals(serviceOrderId),
		});
	}

	static async deleteItem({
		userJwt,
		subdomain,
		serviceOrderId,
		itemId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		itemId: string;
		response: FastifyReply;
	}) {
		const companyId = ServiceOrdersService.resolveCompanyId(userJwt, subdomain);
		await ServiceOrdersService.assertOwnServiceOrder(serviceOrderId, companyId);

		const item = await ServiceOrdersRepository.queryItem(
			serviceOrderId,
			itemId
		);
		if (!item) {
			throw new AppError("SERVICE_ORDER_ITEM_NOT_FOUND");
		}

		await ServiceOrdersRepository.deleteItem(itemId);

		return ServiceOrdersService.sendItems(response, {
			status: 200,
			code: "delete_service_order_item_success",
			message: "Item removed from the service order.",
			data: await ServiceOrdersService.itemsWithTotals(serviceOrderId),
		});
	}
}
