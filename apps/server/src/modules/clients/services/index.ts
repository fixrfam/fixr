import { clients } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createClientSchema,
	getClientsQuerySchema,
	patchClientSchema,
} from "@fixr/schemas/clients";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { type ClientInsert, ClientsRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;
type ClientData = Partial<z.infer<typeof createClientSchema>>;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function normalizePhone(value: string) {
	const digits = onlyDigits(value);
	if (digits.length < 10 || digits.length > 11) {
		throw new AppError("CLIENT_PHONE_INVALID");
	}
	return digits;
}

/** Store documents and phones as digits and the state code uppercased. */
function normalize(data: ClientData): Partial<ClientInsert> {
	const values: Partial<ClientInsert> = { ...data };

	if (data.cpf !== undefined) {
		values.cpf = onlyDigits(data.cpf);
	}
	if (data.phone !== undefined) {
		values.phone = normalizePhone(data.phone);
	}
	if (data.alternativePhone !== undefined) {
		values.alternativePhone = data.alternativePhone.trim()
			? normalizePhone(data.alternativePhone)
			: null;
	}
	if (data.state !== undefined) {
		values.state = data.state.toUpperCase();
	}

	return values;
}

/** @description Business logic for a company's clients (customers) */
export class ClientsService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("CLIENT_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("CLIENT_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** An active client of the company. Deleted or foreign clients are reported as not found. */
	private static async queryOwnClient(clientId: string, companyId: string) {
		const client = await ClientsRepository.queryClientById(clientId);
		if (!client || client.companyId !== companyId || client.deletedAt) {
			throw new AppError("CLIENT_NOT_FOUND");
		}
		return client;
	}

	static async listClients({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getClientsQuerySchema>) {
		const companyId = ClientsService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = ClientsRepository.buildListFilter(companyId, query);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: clients,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: ClientsRepository.buildOrder(sort),
			}),
			getPaginatedCount({ table: clients, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});

		if (!pagination) {
			throw new AppError("CLIENT_PAGE_OUT_OF_BOUNDS");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_clients_success",
				message: "Clients retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getClient({
		userJwt,
		subdomain,
		clientId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		response: FastifyReply;
	}) {
		const companyId = ClientsService.resolveCompanyId(userJwt, subdomain);
		const client = await ClientsService.queryOwnClient(clientId, companyId);
		const serviceOrders = await ClientsRepository.queryRecentServiceOrders(
			clientId,
			companyId
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_client_success",
				message: "Client retrieved successfully.",
				data: { ...client, serviceOrders },
			})
		);
	}

	/**
	 * Create a client. A CPF that belonged to a deleted client of the company
	 * restores that record (keeping its service order history) with the new data.
	 */
	static async createClient({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createClientSchema>;
		response: FastifyReply;
	}) {
		const companyId = ClientsService.resolveCompanyId(userJwt, subdomain);
		const values = normalize(data) as ClientInsert;
		const existing = await ClientsRepository.queryClientByCpf(
			companyId,
			values.cpf
		);

		if (existing && !existing.deletedAt) {
			throw new AppError("CLIENT_CPF_CONFLICT");
		}

		let clientId: string;
		if (existing) {
			clientId = existing.id;
			await ClientsRepository.updateClient(clientId, {
				...values,
				alternativePhone: values.alternativePhone ?? null,
				deletedAt: null,
			});
		} else {
			clientId = await ClientsRepository.insertClient({ ...values, companyId });
		}

		const client = await ClientsRepository.queryClientById(clientId);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_client_success",
				message: "Client created successfully.",
				data: client,
			})
		);
	}

	static async patchClient({
		userJwt,
		subdomain,
		clientId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		data: z.infer<typeof patchClientSchema>;
		response: FastifyReply;
	}) {
		const companyId = ClientsService.resolveCompanyId(userJwt, subdomain);
		await ClientsService.queryOwnClient(clientId, companyId);
		const values = normalize(data);

		if (values.cpf !== undefined) {
			const existing = await ClientsRepository.queryClientByCpf(
				companyId,
				values.cpf
			);
			if (existing && existing.id !== clientId) {
				throw new AppError("CLIENT_CPF_CONFLICT");
			}
		}

		if (Object.keys(values).length > 0) {
			await ClientsRepository.updateClient(clientId, values);
		}

		const client = await ClientsRepository.queryClientById(clientId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_client_success",
				message: "Client updated successfully.",
				data: client,
			})
		);
	}

	/** Soft delete: the client disappears from the API but its service orders keep pointing to it. */
	static async deleteClient({
		userJwt,
		subdomain,
		clientId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		response: FastifyReply;
	}) {
		const companyId = ClientsService.resolveCompanyId(userJwt, subdomain);
		await ClientsService.queryOwnClient(clientId, companyId);

		await ClientsRepository.updateClient(clientId, { deletedAt: new Date() });

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_client_success",
				message: "Client deleted successfully.",
				data: null,
			})
		);
	}
}
