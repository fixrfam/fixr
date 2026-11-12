import { services } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createServiceSchema,
	getServicesQuerySchema,
	patchServiceSchema,
} from "@fixr/schemas/services";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { sumMoney } from "../../../core/lib/money";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { type ServiceRecord, ServicesRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;
type ServiceRow = typeof services.$inferSelect;

/**
 * What the service costs the customer: its own price (labor) plus the
 * current sale price of the parts it uses.
 */
async function withPricing<T extends Pick<ServiceRecord, "price" | "partIds">>(
	records: T[]
) {
	const prices = await ServicesRepository.queryPartPrices([
		...new Set(records.flatMap((record) => record.partIds)),
	]);
	return records.map((record) => {
		const partsPrice = sumMoney(
			record.partIds.map((partId) => prices.get(partId) ?? 0)
		);
		return {
			...record,
			partsPrice,
			totalPrice: sumMoney([record.price, partsPrice]),
		};
	});
}

async function withServicePricing(record: ServiceRecord | null) {
	if (!record) {
		return null;
	}
	const [priced] = await withPricing([record]);
	return priced;
}

/** @description Business logic for the repair services a company offers */
export class ServicesService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("SERVICE_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SERVICE_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** Load a service of the company. Another tenant's service is reported as not found. */
	private static async queryOwnService(serviceId: string, companyId: string) {
		const service = await ServicesRepository.queryServiceById(serviceId);
		if (!service || service.companyId !== companyId) {
			throw new AppError("SERVICE_NOT_FOUND");
		}
		return service;
	}

	/** Deduplicate the part ids and make sure every one belongs to the company. */
	private static async resolvePartIds(companyId: string, partIds: string[]) {
		const unique = [...new Set(partIds)];
		const found = await ServicesRepository.queryPartIdsOfCompany(
			companyId,
			unique
		);
		if (found.length !== unique.length) {
			throw new AppError("SERVICE_PART_NOT_FOUND");
		}
		return unique;
	}

	static async listServices({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		deviceCategory,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getServicesQuerySchema>) {
		const companyId = ServicesService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = ServicesRepository.buildListFilter(companyId, {
			query,
			deviceCategory,
		});

		const [rows, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: services,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: ServicesRepository.buildOrder(sort),
			}) as Promise<ServiceRow[]>,
			getPaginatedCount({ table: services, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: rows.length,
		});

		if (!pagination) {
			throw new AppError("SERVICE_PAGE_OUT_OF_BOUNDS");
		}

		const partIds = await ServicesRepository.queryPartIdsByServiceIds(
			rows.map((row) => row.id)
		);
		const records = await withPricing(
			rows.map((row) => ({
				...row,
				partIds: partIds.get(row.id) ?? [],
			}))
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_services_success",
				message: "Services retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getService({
		userJwt,
		subdomain,
		serviceId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		response: FastifyReply;
	}) {
		const companyId = ServicesService.resolveCompanyId(userJwt, subdomain);
		const service = await withServicePricing(
			await ServicesService.queryOwnService(serviceId, companyId)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_service_success",
				message: "Service retrieved successfully.",
				data: service,
			})
		);
	}

	static async createService({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createServiceSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServicesService.resolveCompanyId(userJwt, subdomain);
		const { partIds, ...values } = data;
		const linkedPartIds = await ServicesService.resolvePartIds(
			companyId,
			partIds
		);

		const serviceId = await ServicesRepository.insertService(
			{ ...values, companyId },
			linkedPartIds
		);
		const service = await withServicePricing(
			await ServicesRepository.queryServiceById(serviceId)
		);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_service_success",
				message: "Service created successfully.",
				data: service,
			})
		);
	}

	static async patchService({
		userJwt,
		subdomain,
		serviceId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		data: z.infer<typeof patchServiceSchema>;
		response: FastifyReply;
	}) {
		const companyId = ServicesService.resolveCompanyId(userJwt, subdomain);
		await ServicesService.queryOwnService(serviceId, companyId);

		const { partIds, ...values } = data;
		const linkedPartIds =
			partIds === undefined
				? undefined
				: await ServicesService.resolvePartIds(companyId, partIds);

		await ServicesRepository.updateService(serviceId, values, linkedPartIds);
		const service = await withServicePricing(
			await ServicesRepository.queryServiceById(serviceId)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_service_success",
				message: "Service updated successfully.",
				data: service,
			})
		);
	}

	static async deleteService({
		userJwt,
		subdomain,
		serviceId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		serviceId: string;
		response: FastifyReply;
	}) {
		const companyId = ServicesService.resolveCompanyId(userJwt, subdomain);
		await ServicesService.queryOwnService(serviceId, companyId);

		await ServicesRepository.deleteService(serviceId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_service_success",
				message: "Service deleted successfully.",
				data: null,
			})
		);
	}
}
