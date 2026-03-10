import { companySelectSchema } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { z } from "zod";
import { apiResponse } from "@/src/helpers/response";
import { queryCompanyById } from "@/src/services/companies/companies.services";

export async function getUserCompanyHandler({
	userJwt,
}: {
	userJwt: z.infer<typeof jwtPayload>;
}) {
	if (!userJwt.company) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: null,
				code: "company_not_found",
				message: "There's no companies bound to your account",
				data: null,
			}),
		} as const;
	}

	const company = await queryCompanyById(userJwt.company.id);

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
