import type { jwtPayload } from "@fixr/schemas/auth";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { Context } from "elysia";
import type { z } from "zod";
import { EmployeesService } from "../services";

export class EmployeesController {
	static getCompanyEmployees({
		subdomain,
		userJwt,
		page,
		perPage,
		query,
		sort,
		ctx,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	} & z.infer<typeof getPaginatedDataSchema>) {
		return EmployeesService.getCompanyEmployees({
			subdomain,
			userJwt,
			page,
			perPage,
			query,
			sort,
			ctx,
		});
	}

	static registerEmployee({
		userJwt,
		subdomain,
		data,
		ctx,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createEmployeeSchema>;
		ctx: Context;
	}) {
		return EmployeesService.registerEmployee({
			userJwt,
			subdomain,
			data,
			ctx,
		});
	}
}
