import { FastifyReply } from "fastify";

import { apiResponse, paginatedData } from "@/src/helpers/response";
import { z } from "zod";
import { jwtPayload } from "@fixr/schemas/auth";
import { and, asc, desc, eq, like } from "drizzle-orm";
import { employees as employeesTable } from "@fixr/db/schema";
import { getPaginatedCount, getPaginatedRecords } from "@/src/services/generic/pagination.services";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";

export async function getCompanyEmployeesHandler({
    userJwt,
    companyId,
    page,
    perPage,
    query,
    sort,
    response,
}: {
    userJwt: z.infer<typeof jwtPayload>;
    companyId: string;
    response: FastifyReply;
} & z.infer<typeof getPaginatedDataSchema>) {
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

    if (userJwt.company.id !== companyId) {
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

    const PER_PAGE = perPage ?? 10;

    //If there is no sort arg, fallback to newer records.
    const order =
        sort === "newer" || !sort ? desc(employeesTable.createdAt) : asc(employeesTable.createdAt);

    const filter = and(
        eq(employeesTable.companyId, companyId),
        like(employeesTable.name, `%${query ?? ""}%`) //like "%%" to fetch all if there is no query
    );

    const [presentations, totalRecords] = await Promise.all([
        getPaginatedRecords({
            table: employeesTable,
            skip: (page - 1) * PER_PAGE,
            take: PER_PAGE,
            where: filter,
            order: order,
        }),
        getPaginatedCount({
            table: employeesTable,
            where: filter,
        }),
    ]);

    /**
     * If there is no records that match the query or no presentations were found,
     * we still return 200, with an empty array
     */
    if (totalRecords == 0) {
        return response.status(200).send(
            apiResponse({
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
            })
        );
    }

    //The total amount of pages is the total_records divided by the amount PER_PAGE, rounded up
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

    /**
     * If the records that were in the previous pages (pages * PER_PAGE),
     * added to the current page records (+ presentations.length),
     * are smaller than the total records (< totalRecords.count),
     * we can assume that there is a following page.
     */
    const next_page = PER_PAGE * (page - 1) + presentations.length < totalRecords ? page + 1 : null;

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            message: "Company employees successfully retrieved.",
            code: "get_company_employees_success",
            data: paginatedData({
                records: presentations,
                pagination: {
                    total_records: totalRecords,
                    total_pages: total_pages,
                    current_page: page,
                    next_page: next_page,
                    prev_page: page > 1 ? page - 1 : null,
                },
            }),
        })
    );
}
