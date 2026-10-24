import { customers } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createCustomerSchema,
	getCustomersQuerySchema,
	patchCustomerSchema,
} from "@fixr/schemas/customers";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { type CustomerInsert, CustomersRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;
type CustomerData = Partial<z.infer<typeof createCustomerSchema>>;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function normalizePhone(value: string) {
	const digits = onlyDigits(value);
	if (digits.length < 10 || digits.length > 11) {
		throw new AppError("CUSTOMER_PHONE_INVALID");
	}
	return digits;
}

/** Store documents and phones as digits and the state code uppercased. */
function normalize(data: CustomerData): Partial<CustomerInsert> {
	const values: Partial<CustomerInsert> = { ...data };

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

/** @description Business logic for a company's customers (customers) */
export class CustomersService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("CUSTOMER_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("CUSTOMER_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** An active customer of the company. Deleted or foreign customers are reported as not found. */
	private static async queryOwnCustomer(customerId: string, companyId: string) {
		const customer = await CustomersRepository.queryCustomerById(customerId);
		if (!customer || customer.companyId !== companyId || customer.deletedAt) {
			throw new AppError("CUSTOMER_NOT_FOUND");
		}
		return customer;
	}

	static async listCustomers({
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
	} & z.infer<typeof getCustomersQuerySchema>) {
		const companyId = CustomersService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = CustomersRepository.buildListFilter(companyId, query);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: customers,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: CustomersRepository.buildOrder(sort),
			}),
			getPaginatedCount({ table: customers, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});

		if (!pagination) {
			throw new AppError("CUSTOMER_PAGE_OUT_OF_BOUNDS");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_customers_success",
				message: "Customers retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getCustomer({
		userJwt,
		subdomain,
		customerId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		response: FastifyReply;
	}) {
		const companyId = CustomersService.resolveCompanyId(userJwt, subdomain);
		const customer = await CustomersService.queryOwnCustomer(
			customerId,
			companyId
		);
		const serviceOrders = await CustomersRepository.queryRecentServiceOrders(
			customerId,
			companyId
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_customer_success",
				message: "Customer retrieved successfully.",
				data: { ...customer, serviceOrders },
			})
		);
	}

	/**
	 * Create a customer. A CPF that belonged to a deleted customer of the company
	 * restores that record (keeping its service order history) with the new data.
	 */
	static async createCustomer({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createCustomerSchema>;
		response: FastifyReply;
	}) {
		const companyId = CustomersService.resolveCompanyId(userJwt, subdomain);
		const values = normalize(data) as CustomerInsert;
		const existing = await CustomersRepository.queryCustomerByCpf(
			companyId,
			values.cpf
		);

		if (existing && !existing.deletedAt) {
			throw new AppError("CUSTOMER_CPF_CONFLICT");
		}

		let customerId: string;
		if (existing) {
			customerId = existing.id;
			await CustomersRepository.updateCustomer(customerId, {
				...values,
				alternativePhone: values.alternativePhone ?? null,
				deletedAt: null,
			});
		} else {
			customerId = await CustomersRepository.insertCustomer({
				...values,
				companyId,
			});
		}

		const customer = await CustomersRepository.queryCustomerById(customerId);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_customer_success",
				message: "Customer created successfully.",
				data: customer,
			})
		);
	}

	static async patchCustomer({
		userJwt,
		subdomain,
		customerId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		data: z.infer<typeof patchCustomerSchema>;
		response: FastifyReply;
	}) {
		const companyId = CustomersService.resolveCompanyId(userJwt, subdomain);
		await CustomersService.queryOwnCustomer(customerId, companyId);
		const values = normalize(data);

		if (values.cpf !== undefined) {
			const existing = await CustomersRepository.queryCustomerByCpf(
				companyId,
				values.cpf
			);
			if (existing && existing.id !== customerId) {
				throw new AppError("CUSTOMER_CPF_CONFLICT");
			}
		}

		if (Object.keys(values).length > 0) {
			await CustomersRepository.updateCustomer(customerId, values);
		}

		const customer = await CustomersRepository.queryCustomerById(customerId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_customer_success",
				message: "Customer updated successfully.",
				data: customer,
			})
		);
	}

	/** Soft delete: the customer disappears from the API but its service orders keep pointing to it. */
	static async deleteCustomer({
		userJwt,
		subdomain,
		customerId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		response: FastifyReply;
	}) {
		const companyId = CustomersService.resolveCompanyId(userJwt, subdomain);
		await CustomersService.queryOwnCustomer(customerId, companyId);

		await CustomersRepository.updateCustomer(customerId, {
			deletedAt: new Date(),
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_customer_success",
				message: "Customer deleted successfully.",
				data: null,
			})
		);
	}
}
