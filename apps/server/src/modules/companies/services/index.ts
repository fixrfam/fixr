import { companySelectSchema } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { CompaniesRepository } from "../repositories";

/** @description Companies business logic */
export class CompaniesService {
	/**
	 * Get the company associated with the authenticated user
	 *
	 * @param userJwt - The authenticated user's JWT payload
	 * @param ctx - Elysia context
	 */
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

	/**
	 * Get a company by its subdomain
	 *
	 * @param subdomain - The company subdomain
	 * @param userJwt - The authenticated user's JWT payload
	 * @param ctx - Elysia context
	 */
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
