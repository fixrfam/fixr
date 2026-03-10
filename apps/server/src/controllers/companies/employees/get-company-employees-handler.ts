import { and, asc, desc, eq, like } from "@fixr/db/connection";
import {
	employees as employeesTable,
	users as usersTable,
} from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { z } from "zod";
import { apiResponse, paginatedData } from "@/src/helpers/response";
import { queryCompanyBySubdomain } from "@/src/services/companies/companies.services";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "@/src/services/generic/pagination.services";

export async function getCompanyEmployeesHandler({
	userJwt,
	subdomain,
	page,
	perPage,
	query,
	sort,
}: {
	userJwt: z.infer<typeof jwtPayload>;
	subdomain: string;
} & z.infer<typeof getPaginatedDataSchema>) {
	if (!userJwt.company) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not Found",
				code: "company_not_found",
				message: "There's no companies bound to your account",
				data: null,
			}),
		} as const;
	}

	if (userJwt.company.subdomain !== subdomain) {
		return {
			status: 403,
			response: apiResponse({
				status: 403,
				error: "Forbidden",
				code: "not_allowed",
				message: "You are not authorized to access this company.",
				data: null,
			}),
		} as const;
	}

	const company = await queryCompanyBySubdomain(subdomain);

	const PER_PAGE = perPage ?? 10;

	const order =
		sort === "newer" || !sort
			? desc(employeesTable.createdAt)
			: asc(employeesTable.createdAt);

	const filter = and(
		eq(employeesTable.companyId, company.id),
		like(employeesTable.name, `%${query ?? ""}%`)
	);

	const [presentations, totalRecords] = (await Promise.all([
		getPaginatedRecords({
			table: employeesTable,
			select: {
				id: employeesTable.id,
				name: employeesTable.name,
				cpf: employeesTable.cpf,
				phone: employeesTable.phone,
				role: employeesTable.role,
				createdAt: employeesTable.createdAt,
				userId: employeesTable.userId,
				companyId: employeesTable.companyId,
				account: {
					id: usersTable.id,
					email: usersTable.email,
					avatarUrl: usersTable.avatarUrl,
					createdAt: usersTable.createdAt,
					verified: usersTable.verified,
				},
			},
			skip: (page - 1) * PER_PAGE,
			take: PER_PAGE,
			where: filter,
			order,
			joins: [
				{
					type: "inner",
					table: usersTable,
					on: eq(usersTable.id, employeesTable.userId),
				},
			],
		}),
		getPaginatedCount({
			table: employeesTable,
			where: filter,
		}),
	])) as [unknown[], number];

	if (totalRecords === 0) {
		return {
			status: 200,
			response: apiResponse({
				status: 200,
				error: null,
				message: "Company employees successfully retrieved.",
				code: "get_company_employees_success",
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
			}),
		} as const;
	}

	const total_pages = Math.ceil(totalRecords / PER_PAGE);

	if (page > total_pages) {
		return {
			status: 416,
			response: apiResponse({
				status: 416,
				error: "Range Not Satisfiable",
				code: "page_out_of_bounds",
				message: "The requested page exceeds the total number of pages.",
				data: null,
			}),
		} as const;
	}

	const next_page =
		PER_PAGE * (page - 1) + presentations.length < totalRecords
			? page + 1
			: null;

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			message: "Company employees successfully retrieved.",
			code: "get_company_employees_success",
			data: paginatedData({
				records: presentations,
				pagination: {
					total_records: totalRecords,
					total_pages,
					current_page: page,
					next_page,
					prev_page: page > 1 ? page - 1 : null,
				},
			}),
		}),
	} as const;
}
