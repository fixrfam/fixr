import { asc, desc } from "@fixr/db/connection";
import { serviceOrders as serviceOrdersTable } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
} from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { isAllowedCompanyPhotoUrl } from "../../../config/r2";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import {
	ServiceOrdersRepository,
	serviceOrdersListJoins,
	serviceOrdersListSelect,
} from "../repositories";

/** @description Service orders business logic */
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
				joins: query ? serviceOrdersListJoins : undefined,
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
		data: z.infer<typeof createServiceOrderMockSchema>;
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

		const [client, deviceMaker, deviceCategory] = await Promise.all([
			ServiceOrdersRepository.queryClientById(data.clientId),
			ServiceOrdersRepository.queryDeviceMakerById(data.deviceBrandId),
			ServiceOrdersRepository.queryDeviceCategoryById(data.deviceCategoryId),
		]);

		if (!client) {
			throw new AppError("SERVICE_ORDER_CLIENT_NOT_FOUND");
		}
		if (!deviceMaker) {
			throw new AppError("SERVICE_ORDER_DEVICE_BRAND_NOT_FOUND");
		}
		if (!deviceCategory) {
			throw new AppError("SERVICE_ORDER_DEVICE_CATEGORY_NOT_FOUND");
		}

		const invalidPhoto = data.photos.find(
			(photo) => !isAllowedCompanyPhotoUrl(photo.url, companyId)
		);

		if (invalidPhoto) {
			throw new AppError("SERVICE_ORDER_INVALID_PHOTO_URL");
		}

		const { serviceOrder, photos } =
			await ServiceOrdersRepository.createWithPhotos({
				companyId,
				employeeId: employee.id,
				data,
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
}
