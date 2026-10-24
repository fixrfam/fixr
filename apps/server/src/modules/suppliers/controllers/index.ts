import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createSupplierSchema,
	getSuppliersQuerySchema,
	patchSupplierSchema,
} from "@fixr/schemas/suppliers";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { SuppliersService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Suppliers request handlers */
export class SuppliersController {
	static listSuppliers(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getSuppliersQuerySchema>
	) {
		return SuppliersService.listSuppliers(params);
	}

	static getSupplier(params: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		response: FastifyReply;
	}) {
		return SuppliersService.getSupplier(params);
	}

	static createSupplier(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createSupplierSchema>;
		response: FastifyReply;
	}) {
		return SuppliersService.createSupplier(params);
	}

	static patchSupplier(params: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		data: z.infer<typeof patchSupplierSchema>;
		response: FastifyReply;
	}) {
		return SuppliersService.patchSupplier(params);
	}

	static deleteSupplier(params: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		response: FastifyReply;
	}) {
		return SuppliersService.deleteSupplier(params);
	}
}
