import { companySelectSchema } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { z } from "zod";
import { apiResponse } from "@/src/helpers/response";
import { queryCompanyBySubdomain } from "@/src/services/companies/companies.services";

export async function getCompanyBySubdomainHandler({
	subdomain,
	userJwt,
}: {
	subdomain: string;
	userJwt: z.infer<typeof jwtPayload>;
}) {
	if (subdomain !== userJwt.company?.subdomain) {
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

	if (!company) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not Found",
				code: "company_not_found",
				message: "Company not found",
				data: null,
			}),
		} as const;
	}

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "get_company_success",
			message: "Company retrieved successfully.",
			data: companySelectSchema.parse(company),
		}),
	} as const;
}
