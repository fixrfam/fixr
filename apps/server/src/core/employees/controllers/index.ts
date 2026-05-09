import type { jwtPayload } from "@fixr/schemas/auth";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { EmployeesService } from "../services";

/** @description Employees request handlers */
export class EmployeesController {
	/**
	 * @description Get paginated company employees
	 */
	static async getCompanyEmployees({
		subdomain,
		userJwt,
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	} & z.infer<typeof getPaginatedDataSchema>) {
		return EmployeesService.getCompanyEmployees({
			subdomain,
			userJwt,
			page,
			perPage,
			query,
			sort,
			response,
		});
	}

	/**
	 * @description Register a new employee
	 */
	static async registerEmployee({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createEmployeeSchema>;
		response: FastifyReply;
	}) {
		return EmployeesService.registerEmployee({
			userJwt,
			subdomain,
			data,
			response,
		});
	}
}
