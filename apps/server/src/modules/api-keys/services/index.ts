import { and, asc, desc, eq, like } from "@fixr/db/connection";
import { apiKeys as apiKeysTable } from "@fixr/db/schema";
import { createAbility } from "@fixr/permissions";
import {
	API_KEY_MAX_TTL_DAYS,
	type createApiKeySchema,
} from "@fixr/schemas/api-keys";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { generateApiKey } from "../../../core/lib/api-key";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { CompaniesRepository } from "../../companies/repositories";
import { EmployeesRepository } from "../../employees/repositories";
import { ApiKeysRepository } from "../repositories";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** @description API keys business logic */
export class ApiKeysService {
	/**
	 * Resolve the employee behind the request, rejecting cross-company access.
	 *
	 * Keys are user-scoped, so every operation needs the employee record and not
	 * just the company: the employee is what a key belongs to.
	 *
	 * @param userJwt - Authenticated user JWT
	 * @param subdomain - Company subdomain from the route
	 * @returns The company and the employee acting on it
	 */
	private static async resolveActor({
		userJwt,
		subdomain,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
	}) {
		if (!userJwt.company) {
			throw new AppError("API_KEY_COMPANY_NOT_FOUND");
		}

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("API_KEY_COMPANY_NOT_ALLOWED");
		}

		const company =
			await CompaniesRepository.queryCompanyBySubdomain(subdomain);

		if (!company) {
			throw new AppError("COMPANY_NOT_FOUND");
		}

		const employee = await EmployeesRepository.getEmployeeByUserAndCompany({
			userId: userJwt.id,
			companyId: company.id,
		});

		if (!employee) {
			throw new AppError("API_KEY_COMPANY_NOT_FOUND");
		}

		return { company, employee };
	}

	/**
	 * Get the caller's own paginated API keys.
	 *
	 * Scoped to the employee, not the company: one employee never sees another's
	 * keys. Secrets are never stored and `keyHash` is excluded from the
	 * projection, so there is nothing sensitive to leak here either.
	 *
	 * @param subdomain - Company subdomain
	 * @param userJwt - Authenticated user JWT
	 * @param page - Page number
	 * @param perPage - Items per page
	 * @param query - Search query matched against the key name
	 * @param sort - Sort direction
	 * @param response - Fastify reply
	 */
	static async getOwnApiKeys({
		subdomain,
		userJwt,
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	} & z.infer<typeof getPaginatedDataSchema>) {
		const { employee } = await ApiKeysService.resolveActor({
			userJwt,
			subdomain,
		});

		const PER_PAGE = perPage ?? 10;

		//If there is no sort arg, fallback to newer records.
		const order =
			sort === "newer" || !sort
				? desc(apiKeysTable.createdAt)
				: asc(apiKeysTable.createdAt);

		const filter = and(
			eq(apiKeysTable.employeeId, employee.id),
			like(apiKeysTable.name, `%${query ?? ""}%`) //like "%%" to fetch all if there is no query
		);

		const [records, totalRecords] = (await Promise.all([
			getPaginatedRecords({
				table: apiKeysTable,
				select: {
					id: apiKeysTable.id,
					name: apiKeysTable.name,
					prefix: apiKeysTable.prefix,
					scopes: apiKeysTable.scopes,
					employeeId: apiKeysTable.employeeId,
					companyId: apiKeysTable.companyId,
					expiresAt: apiKeysTable.expiresAt,
					lastUsedAt: apiKeysTable.lastUsedAt,
					revokedAt: apiKeysTable.revokedAt,
					createdAt: apiKeysTable.createdAt,
				},
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order,
			}),
			getPaginatedCount({ table: apiKeysTable, where: filter }),
		])) as [
			{
				id: string;
				name: string;
				prefix: string;
				scopes: string[];
				employeeId: string;
				companyId: string;
				expiresAt: Date | null;
				lastUsedAt: Date | null;
				revokedAt: Date | null;
				createdAt: Date;
			}[],
			number,
		];

		/**
		 * If there is no records that match the query, we still return 200,
		 * with an empty array
		 */
		if (totalRecords === 0) {
			return response.status(200).send(
				apiResponse({
					status: 200,
					error: null,
					message: "API keys successfully retrieved.",
					code: "get_api_keys_success",
					data: paginatedData({
						records: [],
						pagination: {
							total_records: 0,
							total_pages: 0,
							current_page: 1,
							next_page: null,
							prev_page: null,
						},
					}),
				})
			);
		}

		const total_pages = Math.ceil(totalRecords / PER_PAGE);

		if (page > total_pages) {
			throw new AppError("API_KEY_PAGE_OUT_OF_BOUNDS");
		}

		const next_page =
			PER_PAGE * (page - 1) + records.length < totalRecords ? page + 1 : null;

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				message: "API keys successfully retrieved.",
				code: "get_api_keys_success",
				data: paginatedData({
					records,
					pagination: {
						total_records: totalRecords,
						total_pages,
						current_page: page,
						next_page,
						prev_page: page > 1 ? page - 1 : null,
					},
				}),
			})
		);
	}

	/**
	 * Create an API key for the authenticated employee.
	 *
	 * The plaintext secret is returned exactly once: only its HMAC is persisted,
	 * so it can never be recovered afterwards.
	 *
	 * @param userJwt - Authenticated user JWT
	 * @param subdomain - Company subdomain
	 * @param data - Key creation payload
	 * @param response - Fastify reply
	 */
	static async createApiKey({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createApiKeySchema>;
		response: FastifyReply;
	}) {
		const { company, employee } = await ApiKeysService.resolveActor({
			userJwt,
			subdomain,
		});

		const maxExpiration = new Date(
			Date.now() + API_KEY_MAX_TTL_DAYS * MILLISECONDS_PER_DAY
		);

		if (data.expiresAt && data.expiresAt > maxExpiration) {
			throw new AppError("API_KEY_EXPIRATION_TOO_FAR");
		}

		/**
		 * A key must never grant more than its creator has. Requested scopes are
		 * validated against the creator's role here, and intersected again at
		 * request time by the middleware in case that role changes later.
		 */
		const creatorRole = userJwt.company?.role ?? "guest";
		const creatorAbility = createAbility(creatorRole);
		const invalidScopes = data.scopes.filter(
			(scope) => !creatorAbility.permissions.includes(scope)
		);

		if (invalidScopes.length > 0) {
			throw new AppError("API_KEY_INVALID_SCOPES", { invalidScopes });
		}

		const existingName = await ApiKeysRepository.getActiveByNameAndEmployee({
			name: data.name,
			employeeId: employee.id,
		});

		if (existingName) {
			throw new AppError("API_KEY_NAME_CONFLICT");
		}

		const { prefix, keyHash, token } = generateApiKey();

		const apiKeyId = await ApiKeysRepository.createApiKey({
			name: data.name,
			prefix,
			keyHash,
			employeeId: employee.id,
			companyId: company.id,
			scopes: data.scopes,
			expiresAt: data.expiresAt ?? null,
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_api_key_success",
				message:
					"API key created successfully. Store the secret now, it will not be shown again.",
				data: {
					id: apiKeyId,
					name: data.name,
					prefix,
					scopes: data.scopes,
					expiresAt: data.expiresAt ?? null,
					createdAt: new Date(),
					secret: token,
				},
			})
		);
	}

	/**
	 * Revoke one of the caller's own API keys.
	 *
	 * A key that belongs to another employee resolves to "not found" rather than
	 * "forbidden", so the endpoint cannot be used to probe for other people's
	 * key IDs. Revocation is a soft delete: the row is kept so the audit trail
	 * survives.
	 *
	 * @param userJwt - Authenticated user JWT
	 * @param subdomain - Company subdomain
	 * @param apiKeyId - The key to revoke
	 * @param response - Fastify reply
	 */
	static async revokeApiKey({
		userJwt,
		subdomain,
		apiKeyId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		apiKeyId: string;
		response: FastifyReply;
	}) {
		const { employee } = await ApiKeysService.resolveActor({
			userJwt,
			subdomain,
		});

		const apiKey = await ApiKeysRepository.getByIdAndEmployee({
			apiKeyId,
			employeeId: employee.id,
		});

		if (!apiKey) {
			throw new AppError("API_KEY_NOT_FOUND");
		}

		if (apiKey.revokedAt) {
			throw new AppError("API_KEY_ALREADY_REVOKED");
		}

		await ApiKeysRepository.revokeApiKey(apiKey.id);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "revoke_api_key_success",
				message: "API key revoked successfully.",
				data: null,
			})
		);
	}
}
