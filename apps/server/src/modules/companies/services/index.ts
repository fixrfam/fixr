import { APP_NAME } from "@fixr/constants/app";
import { unmask } from "@fixr/constants/masks";
import { companySelectSchema } from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import { emailDisplayName } from "@fixr/mail/services";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { createCompanySchema } from "@fixr/schemas/companies";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { CompaniesRepository } from "../repositories";

/** @description Companies business logic */
export class CompaniesService {
	/**
	 * Get the company associated with the authenticated user
	 *
	 * @param userJwt - The authenticated user's JWT payload
	 * @param response - Fastify reply
	 */
	static async getUserCompany({
		userJwt,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("COMPANY_USER_NOT_FOUND");
		}

		const company = await CompaniesRepository.queryCompanyById(
			userJwt.company.id
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_company_success",
				message: "Company retrieved successfully.",
				data: companySelectSchema.parse(company),
			})
		);
	}

	/**
	 * Get a company by its subdomain
	 *
	 * @param subdomain - The company subdomain
	 * @param userJwt - The authenticated user's JWT payload
	 * @param response - Fastify reply
	 */
	static async getCompanyBySubdomain({
		subdomain,
		userJwt,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	}) {
		if (subdomain !== userJwt.company?.subdomain) {
			throw new AppError("COMPANY_NOT_ALLOWED");
		}

		const company =
			await CompaniesRepository.queryCompanyBySubdomain(subdomain);

		if (!company) {
			throw new AppError("COMPANY_NOT_FOUND");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_company_success",
				message: "Company retrieved successfully.",
				data: companySelectSchema.parse(company),
			})
		);
	}

	/**
	 * @description Create a new company with an admin user
	 */
	static async createCompany({
		body,
		response,
	}: {
		body: z.infer<typeof createCompanySchema>;
		response: FastifyReply;
	}) {
		const formatted = {
			...body,
			subdomain: body.subdomain.toLowerCase(),
			cnpj: unmask.cnpj(body.cnpj),
			owner_cpf: unmask.cpf(body.owner_cpf),
		};

		const [
			existingEmployee,
			existingCompany,
			existingEmail,
			existingSubdomain,
		] = await Promise.all([
			CompaniesRepository.queryEmployeeByCpf(formatted.owner_cpf),
			CompaniesRepository.queryCompanyByCnpj(formatted.cnpj),
			CompaniesRepository.queryUserByEmail(formatted.owner_email),
			CompaniesRepository.queryCompanyBySubdomain(formatted.subdomain),
		]);

		if (existingEmployee) {
			throw new AppError("CPF_CONFLICT");
		}

		if (existingCompany) {
			throw new AppError("CNPJ_CONFLICT");
		}

		if (existingEmail) {
			throw new AppError("EMAIL_ALREADY_EXISTS");
		}

		if (existingSubdomain) {
			throw new AppError("SUBDOMAIN_TAKEN");
		}

		await CompaniesRepository.createOrgWithAdmin(formatted);

		const emailQueue = createEmailQueue(redis);

		await queueEmail(emailQueue, {
			job: "sendInviteEmail",
			payload: {
				to: formatted.owner_email,
				appName: APP_NAME,
				companyName: formatted.name,
				ctaUrl: `${env.FRONTEND_URL}/auth/login`,
				displayName: `Admin - ${emailDisplayName(formatted.owner_email)}`,
				password: formatted.owner_password,
			},
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "company_create_success",
				message: "Company created successfully.",
				data: null,
			})
		);
	}
}
