import { FastifyReply } from "fastify";

import { apiResponse } from "@/src/helpers/response";
import { z } from "zod";
import { jwtPayload } from "@repo/schemas/auth";
import { queryCompanyById } from "@/src/services/companies/companies.services";
import { companySelectSchema } from "@repo/db/schema";

export async function getCompanyByIdHandler({
    companyId,
    userJwt,
    response,
}: {
    companyId: string;
    userJwt: z.infer<typeof jwtPayload>;
    response: FastifyReply;
}) {
    if (companyId !== userJwt.company?.id) {
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

    const company = await queryCompanyById(companyId);

    if (!company) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "company_not_found",
                message: "Company not found",
                data: null,
            })
        );
    }

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "get_company_success",
            message: "Company retrieved successfully.",
            data: companySelectSchema.parse(company),
        })
    );
}
