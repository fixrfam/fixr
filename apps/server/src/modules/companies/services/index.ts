import { companySelectSchema } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { CompaniesRepository } from "../repositories";

export class CompaniesService {
	static async getUserCompany({
		userJwt,
		ctx,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	}) {
		if (!userJwt.company) {
			throw new AppError("COMPANY_USER_NOT_FOUND");
		}

		const company = await CompaniesRepository.queryCompanyById(
			userJwt.company.id
		);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "get_company_success",
			message: "Company retrieved successfully.",
			data: companySelectSchema.parse(company),
		});
	}

	static async getCompanyBySubdomain({
		subdomain,
		userJwt,
		ctx,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	}) {
		if (subdomain !== userJwt.company?.subdomain) {
			throw new AppError("COMPANY_NOT_ALLOWED");
		}

		const company =
			await CompaniesRepository.queryCompanyBySubdomain(subdomain);

		if (!company) {
			throw new AppError("COMPANY_NOT_FOUND");
		}

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "get_company_success",
			message: "Company retrieved successfully.",
			data: companySelectSchema.parse(company),
		});
	}
}
