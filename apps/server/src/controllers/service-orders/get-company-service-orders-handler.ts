import { asc, desc } from "@fixr/db/connection";
import { serviceOrders as serviceOrdersTable } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { getServiceOrdersQuerySchema } from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";

import {
	buildServiceOrdersListFilter,
	serviceOrdersListJoins,
	serviceOrdersListSelect,
} from "@/src/services/service-orders/service-orders-list.services";
import { apiResponse, paginatedData } from "@/src/core/lib/response";
import { getPaginatedCount, getPaginatedRecords } from "@/src/core/lib/pagination";
import { CompaniesRepository} from "../../modules/companies/repositories";


export async function getCompanyServiceOrdersHandler({
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
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "company_not_found",
				message: "There's no companies bound to your account",
				data: null,
			})
		);
	}

	if (userJwt.company.subdomain !== subdomain) {
		return response.status(403).send(
			apiResponse({
				status: 403,
				error: "Forbidden",
				code: "not_allowed",
				message: "You are not authorized to access this company.",
				data: null,
			})
		);
	}

	await CompaniesRepository.queryCompanyBySubdomain(subdomain);
	const PER_PAGE = perPage ?? 10;

	const order =
		sort === "newer" || !sort
			? desc(serviceOrdersTable.createdAt)
			: asc(serviceOrdersTable.createdAt);

	const filter = buildServiceOrdersListFilter({
		companyId: userJwt.company.id,
		filters: {
			query,
			deviceCategoryId,
			employeeId,
			status,
			dateFrom,
			dateTo,
		},
	});

	const listJoins = query ? serviceOrdersListJoins : undefined;

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
			joins: listJoins,
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
		return response.status(416).send(
			apiResponse({
				status: 416,
				error: "Range Not Satisfiable",
				code: "page_out_of_bounds",
				message: "The requested page exceeds the total number of pages.",
				data: null,
			})
		);
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
