import { suppliers } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createSupplierSchema,
	getSuppliersQuerySchema,
	patchSupplierSchema,
} from "@fixr/schemas/suppliers";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { SuppliersRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** @description Business logic for suppliers */
export class SuppliersService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("SUPPLIER_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SUPPLIER_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** Load a supplier of the company. Another tenant's supplier is reported as not found. */
	private static async queryOwnSupplier(supplierId: string, companyId: string) {
		const supplier = await SuppliersRepository.querySupplierById(supplierId);
		if (!supplier || supplier.companyId !== companyId) {
			throw new AppError("SUPPLIER_NOT_FOUND");
		}
		return supplier;
	}

	private static async assertCnpjAvailable(
		companyId: string,
		cnpj: string,
		currentSupplierId?: string
	) {
		const existing = await SuppliersRepository.querySupplierByCnpj(
			companyId,
			cnpj
		);
		if (existing && existing.id !== currentSupplierId) {
			throw new AppError("SUPPLIER_CNPJ_CONFLICT");
		}
	}

	static async listSuppliers({
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
	} & z.infer<typeof getSuppliersQuerySchema>) {
		const companyId = SuppliersService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = SuppliersRepository.buildListFilter(companyId, query);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: suppliers,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: SuppliersRepository.buildOrder(sort),
			}),
			getPaginatedCount({ table: suppliers, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});

		if (!pagination) {
			throw new AppError("SUPPLIER_PAGE_OUT_OF_BOUNDS");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_suppliers_success",
				message: "Suppliers retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getSupplier({
		userJwt,
		subdomain,
		supplierId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		response: FastifyReply;
	}) {
		const companyId = SuppliersService.resolveCompanyId(userJwt, subdomain);
		const supplier = await SuppliersService.queryOwnSupplier(
			supplierId,
			companyId
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_supplier_success",
				message: "Supplier retrieved successfully.",
				data: supplier,
			})
		);
	}

	static async createSupplier({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createSupplierSchema>;
		response: FastifyReply;
	}) {
		const companyId = SuppliersService.resolveCompanyId(userJwt, subdomain);
		const cnpj = onlyDigits(data.cnpj);

		await SuppliersService.assertCnpjAvailable(companyId, cnpj);

		const supplierId = await SuppliersRepository.insertSupplier({
			...data,
			cnpj,
			companyId,
		});
		const supplier = await SuppliersRepository.querySupplierById(supplierId);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_supplier_success",
				message: "Supplier created successfully.",
				data: supplier,
			})
		);
	}

	static async patchSupplier({
		userJwt,
		subdomain,
		supplierId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		data: z.infer<typeof patchSupplierSchema>;
		response: FastifyReply;
	}) {
		const companyId = SuppliersService.resolveCompanyId(userJwt, subdomain);
		await SuppliersService.queryOwnSupplier(supplierId, companyId);

		const values = {
			...data,
			...(data.cnpj === undefined ? {} : { cnpj: onlyDigits(data.cnpj) }),
		};

		if (values.cnpj !== undefined) {
			await SuppliersService.assertCnpjAvailable(
				companyId,
				values.cnpj,
				supplierId
			);
		}

		if (Object.keys(values).length > 0) {
			await SuppliersRepository.updateSupplier(supplierId, values);
		}

		const supplier = await SuppliersRepository.querySupplierById(supplierId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_supplier_success",
				message: "Supplier updated successfully.",
				data: supplier,
			})
		);
	}

	static async deleteSupplier({
		userJwt,
		subdomain,
		supplierId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		supplierId: string;
		response: FastifyReply;
	}) {
		const companyId = SuppliersService.resolveCompanyId(userJwt, subdomain);
		await SuppliersService.queryOwnSupplier(supplierId, companyId);

		if ((await SuppliersRepository.countPartsBySupplier(supplierId)) > 0) {
			throw new AppError("SUPPLIER_IN_USE");
		}

		await SuppliersRepository.deleteSupplier(supplierId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_supplier_success",
				message: "Supplier deleted successfully.",
				data: null,
			})
		);
	}
}
