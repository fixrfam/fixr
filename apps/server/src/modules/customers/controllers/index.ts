import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createCustomerSchema,
	getCustomersQuerySchema,
	patchCustomerSchema,
} from "@fixr/schemas/customers";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { CustomersService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Customers request handlers */
export class CustomersController {
	static listCustomers(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getCustomersQuerySchema>
	) {
		return CustomersService.listCustomers(params);
	}

	static getCustomer(params: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		response: FastifyReply;
	}) {
		return CustomersService.getCustomer(params);
	}

	static createCustomer(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createCustomerSchema>;
		response: FastifyReply;
	}) {
		return CustomersService.createCustomer(params);
	}

	static patchCustomer(params: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		data: z.infer<typeof patchCustomerSchema>;
		response: FastifyReply;
	}) {
		return CustomersService.patchCustomer(params);
	}

	static deleteCustomer(params: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		response: FastifyReply;
	}) {
		return CustomersService.deleteCustomer(params);
	}
}
