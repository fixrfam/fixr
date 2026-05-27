import type { jwtPayload } from "@fixr/schemas/auth";
import type { createCompanySchema } from "@fixr/schemas/companies";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { CompaniesService } from "../services";

/** @description Companies request handlers */
export class CompaniesController {
	/**
	 * @description Get the current user's company
	 */
	static getUserCompany({
		userJwt,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		return CompaniesService.getUserCompany({ userJwt, response });
	}

	/**
	 * @description Get a company by subdomain
	 */
	static getCompanyBySubdomain({
		subdomain,
		userJwt,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		return CompaniesService.getCompanyBySubdomain({
			subdomain,
			userJwt,
			response,
		});
	}

	/**
	 * @description Create a new company
	 */
	static createCompany({
		body,
		response,
	}: {
		body: z.infer<typeof createCompanySchema>;
		response: FastifyReply;
	}) {
		return CompaniesService.createCompany({ body, response });
	}
}
