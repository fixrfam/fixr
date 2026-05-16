import { APP_NAME } from "@fixr/constants/app";
import { and, asc, desc, eq, like } from "@fixr/db/connection";
import {
	employees as employeesTable,
	users as usersTable,
} from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { employeeRoles } from "@fixr/schemas/roles";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { Context } from "elysia";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
import { generateRandomPassword } from "../../../core/lib/generate-password";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { AuthRepository } from "../../auth/repositories";
import { CompaniesRepository } from "../../companies/repositories";
import { EmployeesRepository } from "../repositories";

export class EmployeesService {
	static async getCompanyEmployees({
		subdomain,
		userJwt,
		page,
		perPage,
		query,
		sort,
		ctx,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		ctx: Context;
	} & z.infer<typeof getPaginatedDataSchema>) {
		if (!userJwt.company) {
			throw new AppError("EMPLOYEE_COMPANY_NOT_FOUND");
		}

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("EMPLOYEE_NOT_ALLOWED");
		}

		const company =
			await CompaniesRepository.queryCompanyBySubdomain(subdomain);

		const PER_PAGE = perPage ?? 10;

		const order =
			sort === "newer" || !sort
				? desc(employeesTable.createdAt)
				: asc(employeesTable.createdAt);

		const filter = and(
			eq(employeesTable.companyId, company.id),
			like(employeesTable.name, `%${query ?? ""}%`)
		);

		const [presentations, totalRecords] = (await Promise.all([
			getPaginatedRecords({
				table: employeesTable,
				select: {
					id: employeesTable.id,
					name: employeesTable.name,
					cpf: employeesTable.cpf,
					phone: employeesTable.phone,
					role: employeesTable.role,
					createdAt: employeesTable.createdAt,
					userId: employeesTable.userId,
					companyId: employeesTable.companyId,
					account: {
						id: usersTable.id,
						email: usersTable.email,
						avatarUrl: usersTable.avatarUrl,
						createdAt: usersTable.createdAt,
						verified: usersTable.verified,
					},
				},
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order,
				joins: [
					{
						type: "inner",
						table: usersTable,
						on: eq(usersTable.id, employeesTable.userId),
					},
				],
			}),
			getPaginatedCount({
				table: employeesTable,
				where: filter,
			}),
		])) as [
			{
				id: string;
				name: string;
				cpf: string;
				phone: string | null;
				role: "admin" | "manager" | "technician" | "warehouse" | "financial";
				createdAt: Date;
				userId: string;
				companyId: string;
				account: {
					id: string;
					email: string;
					avatarUrl: string | null;
					createdAt: Date;
					verified: boolean | null;
				};
			}[],
			number,
		];

		if (totalRecords === 0) {
			ctx.set.status = 200;
			return apiResponse({
				status: 200,
				error: null,
				message: "Company employees successfully retrieved.",
				code: "get_company_employees_success",
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
			});
		}

		const total_pages = Math.ceil(totalRecords / PER_PAGE);

		if (page > total_pages) {
			throw new AppError("EMPLOYEE_PAGE_OUT_OF_BOUNDS");
		}

		const next_page =
			PER_PAGE * (page - 1) + presentations.length < totalRecords
				? page + 1
				: null;

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			message: "Company employees successfully retrieved.",
			code: "get_company_employees_success",
			data: paginatedData({
				records: presentations,
				pagination: {
					total_records: totalRecords,
					total_pages,
					current_page: page,
					next_page,
					prev_page: page > 1 ? page - 1 : null,
				},
			}),
		});
	}

	static async registerEmployee({
		userJwt,
		subdomain,
		data,
		ctx,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createEmployeeSchema>;
		ctx: Context;
	}) {
		if (!userJwt.company) {
			throw new AppError("EMPLOYEE_COMPANY_NOT_FOUND");
		}

		const allowedRoles = ["admin", "manager"] as z.infer<
			typeof employeeRoles
		>[];
		const isSameCompany = userJwt.company.subdomain === subdomain;
		const isPrivilegedUser = allowedRoles.includes(userJwt.company.role);

		if (!(isSameCompany && isPrivilegedUser)) {
			throw new AppError("EMPLOYEE_NOT_ALLOWED");
		}

		const violatesRoleHierarchy =
			userJwt.company.role === "manager" && data.role === "admin";

		if (violatesRoleHierarchy) {
			throw new AppError("EMPLOYEE_VIOLATES_ROLE_HIERARCHY");
		}

		const existingEmailQuery = AuthRepository.queryUserByEmail(data.email);
		const existingCpfQuery = EmployeesRepository.getEmployeeByCpf(data.cpf);
		const companyQuery = CompaniesRepository.queryCompanyBySubdomain(subdomain);

		const [existingEmail, existingCpf, company] = await Promise.all([
			existingEmailQuery,
			existingCpfQuery,
			companyQuery,
		]);

		if (existingEmail) {
			throw new AppError("EMPLOYEE_EMAIL_ALREADY_USED");
		}

		if (existingCpf) {
			throw new AppError("EMPLOYEE_CPF_CONFLICT");
		}

		const employeePassword = data.password ?? generateRandomPassword();

		await EmployeesRepository.createEmployeeAndAccount({
			data: { ...data, password: employeePassword },
			companyId: company.id,
		});

		const emailQueue = createEmailQueue(redis);

		await queueEmail(emailQueue, {
			job: "sendInviteEmail",
			payload: {
				to: data.email,
				appName: APP_NAME,
				companyName: userJwt.company.name,
				ctaUrl: `${env.FRONTEND_URL}/auth/login`,
				displayName: data.name,
				password: employeePassword,
			},
		});

		ctx.set.status = 201;
		return apiResponse({
			status: 201,
			error: null,
			code: "create_employee_success",
			message: "Employee created successfully.",
			data: null,
		});
	}
}
