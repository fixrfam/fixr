import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createServiceSchema,
	getServicesQuerySchema,
	patchServiceSchema,
} from "@fixr/schemas/services";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ServicesService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Services request handlers */
export class ServicesController {
	static listServices(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getServicesQuerySchema>
	) {
		return ServicesService.listServices(params);
	}

	static getService(params: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		response: FastifyReply;
	}) {
		return ServicesService.getService(params);
	}

	static createService(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createServiceSchema>;
		response: FastifyReply;
	}) {
		return ServicesService.createService(params);
	}

	static patchService(params: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		data: z.infer<typeof patchServiceSchema>;
		response: FastifyReply;
	}) {
		return ServicesService.patchService(params);
	}

	static deleteService(params: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		response: FastifyReply;
	}) {
		return ServicesService.deleteService(params);
	}
}
