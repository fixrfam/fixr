import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createClientSchema,
	getClientsQuerySchema,
	patchClientSchema,
} from "@fixr/schemas/clients";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ClientsService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Clients request handlers */
export class ClientsController {
	static listClients(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getClientsQuerySchema>
	) {
		return ClientsService.listClients(params);
	}

	static getClient(params: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		response: FastifyReply;
	}) {
		return ClientsService.getClient(params);
	}

	static createClient(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createClientSchema>;
		response: FastifyReply;
	}) {
		return ClientsService.createClient(params);
	}

	static patchClient(params: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		data: z.infer<typeof patchClientSchema>;
		response: FastifyReply;
	}) {
		return ClientsService.patchClient(params);
	}

	static deleteClient(params: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		response: FastifyReply;
	}) {
		return ClientsService.deleteClient(params);
	}
}
