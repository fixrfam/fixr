import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	addServiceOrderItemSchema,
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderItemSchema,
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

	static listItems(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		response: FastifyReply;
	}) {
		return ServiceOrdersService.listItems(params);
	}

	static addItem(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		data: z.infer<typeof addServiceOrderItemSchema>;
		response: FastifyReply;
	}) {
		return ServiceOrdersService.addItem(params);
	}

	static patchItem(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		itemId: string;
		data: z.infer<typeof patchServiceOrderItemSchema>;
		response: FastifyReply;
	}) {
		return ServiceOrdersService.patchItem(params);
	}

	static deleteItem(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		serviceOrderId: string;
		itemId: string;
		response: FastifyReply;
	}) {
		return ServiceOrdersService.deleteItem(params);
	}
}
