import { parts } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	adjustPartStockSchema,
	createPartSchema,
	getPartsQuerySchema,
	patchPartSchema,
} from "@fixr/schemas/parts";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import {
	PartsRepository,
	partsListJoins,
	partsListSelect,
} from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Business logic for parts (inventory items) */
export class PartsService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("PART_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("PART_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** Load a part of the company. Another tenant's part is reported as not found. */
	private static async queryOwnPart(partId: string, companyId: string) {
		const part = await PartsRepository.queryPartById(partId);
		if (!part || part.companyId !== companyId) {
			throw new AppError("PART_NOT_FOUND");
		}
		return part;
	}

	private static async assertSupplierOfCompany(
		supplierId: string,
		companyId: string
	) {
		const supplier = await PartsRepository.querySupplierOfCompany(
			supplierId,
			companyId
		);
		if (!supplier) {
			throw new AppError("PART_SUPPLIER_NOT_FOUND");
		}
	}

	private static async assertSkuAvailable(
		companyId: string,
		sku: string,
		currentPartId?: string
	) {
		const existing = await PartsRepository.queryPartBySku(companyId, sku);
		if (existing && existing.id !== currentPartId) {
			throw new AppError("PART_SKU_CONFLICT");
		}
	}

	static async listParts({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		category,
		supplierId,
		lowStock,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getPartsQuerySchema>) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = PartsRepository.buildListFilter(companyId, {
			query,
			category,
			supplierId,
			lowStock,
		});

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: parts,
				select: partsListSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: PartsRepository.buildOrder(sort),
				joins: partsListJoins,
			}),
			getPaginatedCount({ table: parts, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});

		if (!pagination) {
			throw new AppError("PART_PAGE_OUT_OF_BOUNDS");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_parts_success",
				message: "Parts retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getPart({
		userJwt,
		subdomain,
		partId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		response: FastifyReply;
	}) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);
		const part = await PartsService.queryOwnPart(partId, companyId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_part_success",
				message: "Part retrieved successfully.",
				data: part,
			})
		);
	}

	static async createPart({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createPartSchema>;
		response: FastifyReply;
	}) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);

		await Promise.all([
			PartsService.assertSupplierOfCompany(data.supplierId, companyId),
			PartsService.assertSkuAvailable(companyId, data.sku),
		]);

		const partId = await PartsRepository.insertPart({
			...data,
			description: data.description ?? null,
			companyId,
		});
		const part = await PartsRepository.queryPartById(partId);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_part_success",
				message: "Part created successfully.",
				data: part,
			})
		);
	}

	static async patchPart({
		userJwt,
		subdomain,
		partId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		data: z.infer<typeof patchPartSchema>;
		response: FastifyReply;
	}) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);
		const current = await PartsService.queryOwnPart(partId, companyId);

		// The schema only compares prices sent together; compare with the stored one otherwise.
		const costPrice = data.costPrice ?? current.costPrice;
		const salePrice = data.salePrice ?? current.salePrice;
		if (salePrice < costPrice) {
			throw new AppError("PART_SALE_PRICE_BELOW_COST");
		}

		await Promise.all([
			data.supplierId === undefined
				? null
				: PartsService.assertSupplierOfCompany(data.supplierId, companyId),
			data.sku === undefined
				? null
				: PartsService.assertSkuAvailable(companyId, data.sku, partId),
		]);

		if (Object.keys(data).length > 0) {
			await PartsRepository.updatePart(partId, data);
		}

		const part = await PartsRepository.queryPartById(partId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_part_success",
				message: "Part updated successfully.",
				data: part,
			})
		);
	}

	static async adjustStock({
		userJwt,
		subdomain,
		partId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		data: z.infer<typeof adjustPartStockSchema>;
		response: FastifyReply;
	}) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);
		await PartsService.queryOwnPart(partId, companyId);

		const adjusted = await PartsRepository.adjustStock(partId, data.delta);
		if (!adjusted) {
			throw new AppError("PART_STOCK_INSUFFICIENT");
		}

		const part = await PartsRepository.queryPartById(partId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "adjust_part_stock_success",
				message: "Part stock adjusted successfully.",
				data: part,
			})
		);
	}

	static async deletePart({
		userJwt,
		subdomain,
		partId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		response: FastifyReply;
	}) {
		const companyId = PartsService.resolveCompanyId(userJwt, subdomain);
		await PartsService.queryOwnPart(partId, companyId);

		await PartsRepository.deletePart(partId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_part_success",
				message: "Part deleted successfully.",
				data: null,
			})
		);
	}
}
