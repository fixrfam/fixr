import { companySelectSchema } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../lib/app-error";
import { apiResponse } from "../../lib/response";
import { CompaniesRepository } from "../repositories";

/** @description Companies business logic */
export class CompaniesService {
	/**
	 * Get the company associated with the authenticated user
	 *
	 * @param userJwt - The authenticated user's JWT payload
	 * @param response - Fastify reply
	 */
	static async getUserCompany({
		userJwt,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("COMPANY_USER_NOT_FOUND");
		}

		const company = await CompaniesRepository.queryCompanyById(
			userJwt.company.id
		);

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

	/**
	 * Get a company by its subdomain
	 *
	 * @param subdomain - The company subdomain
	 * @param userJwt - The authenticated user's JWT payload
	 * @param response - Fastify reply
	 */
	static async getCompanyBySubdomain({
		subdomain,
		userJwt,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		if (subdomain !== userJwt.company?.subdomain) {
			throw new AppError("COMPANY_NOT_ALLOWED");
		}

		const company =
			await CompaniesRepository.queryCompanyBySubdomain(subdomain);

		if (!company) {
			throw new AppError("COMPANY_NOT_FOUND");
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
}
