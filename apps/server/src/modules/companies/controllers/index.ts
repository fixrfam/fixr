import type { jwtPayload } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { CompaniesService } from "../services";

export class CompaniesController {
	static getUserCompany({
		userJwt,
		ctx,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	}) {
		return CompaniesService.getUserCompany({ userJwt, ctx });
	}

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
