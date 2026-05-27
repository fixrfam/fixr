import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
} from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ServiceOrdersService } from "../services";

/** @description Service orders request handlers */
export class ServiceOrdersController {
	static getCompanyServiceOrders({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		deviceCategoryId,
		employeeId,
		status,
		dateFrom,
		dateTo,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getServiceOrdersQuerySchema>) {
		return ServiceOrdersService.getCompanyServiceOrders({
			userJwt,
			subdomain,
			page,
			perPage,
			query,
			sort,
			deviceCategoryId,
			employeeId,
			status,
			dateFrom,
			dateTo,
			response,
		});
	}

	static createServiceOrder({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createServiceOrderMockSchema>;
		response: FastifyReply;
	}) {
		return ServiceOrdersService.createServiceOrder({
			userJwt,
			subdomain,
			data,
			response,
		});
	}
}
