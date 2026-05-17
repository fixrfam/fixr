import type { jwtPayload } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { CompaniesService } from "../services";

/** @description Companies request handlers */
export class CompaniesController {
	/** @description Get the current user's company */
	static getUserCompany({
		userJwt,
		ctx,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	}) {
		return CompaniesService.getUserCompany({ userJwt, ctx });
	}

	/** @description Get a company by subdomain */
	static getCompanyBySubdomain({
		subdomain,
		userJwt,
		ctx,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	}) {
		return CompaniesService.getCompanyBySubdomain({
			subdomain,
			userJwt,
			ctx,
		});
	}
}
