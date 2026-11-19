import { departments } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	getDepartmentsQuerySchema,
	patchDepartmentSchema,
	putEmployeeDepartmentsSchema,
	putStageOwnersSchema,
} from "@fixr/schemas/departments";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { inTransaction } from "../../../core/lib/transaction";
import {
	DepartmentsRepository,
	departmentsListJoins,
	departmentsListSelect,
} from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

interface Scoped {
	userJwt: UserJwt;
	subdomain: string;
	response: FastifyReply;
}

/** @description Business logic for departments, their members and the default owner of each stage */
export class DepartmentsService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("DEPARTMENT_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("DEPARTMENT_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	private static async assertOwnDepartment(
		departmentId: string,
		companyId: string
	) {
		const department = await DepartmentsRepository.queryDepartmentOfCompany(
			departmentId,
			companyId
		);
		if (!department) {
			throw new AppError("DEPARTMENT_NOT_FOUND");
		}
		return department;
	}

	private static async assertNameFree(
		companyId: string,
		name: string,
		departmentId?: string
	) {
		const existing = await DepartmentsRepository.queryDepartmentByName(
			companyId,
			name
		);
		if (existing && existing.id !== departmentId) {
			throw new AppError("DEPARTMENT_NAME_CONFLICT");
		}
	}

	/** The department with its leader and members. */
	private static async detail(departmentId: string, companyId: string) {
		const department = await DepartmentsService.assertOwnDepartment(
			departmentId,
			companyId
		);
		return {
			...department,
			members: await DepartmentsRepository.queryMembers(departmentId),
		};
	}

	private static sendDetail(
		response: FastifyReply,
		{
			status,
			code,
			message,
			data,
		}: {
			status: 200 | 201;
			code: string;
			message: string;
			data: Awaited<ReturnType<typeof DepartmentsService.detail>>;
		}
	) {
		return response
			.status(status)
			.send(apiResponse({ status, error: null, code, message, data }));
	}

	static async listDepartments({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		response,
	}: Scoped & z.infer<typeof getDepartmentsQuerySchema>) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = DepartmentsRepository.buildListFilter(companyId, query);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: departments,
				select: departmentsListSelect,
				joins: departmentsListJoins,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: DepartmentsRepository.buildOrder(sort),
			}),
			getPaginatedCount({ table: departments, where: filter }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});
		if (!pagination) {
			throw new AppError("DEPARTMENT_PAGE_OUT_OF_BOUNDS");
		}

		const rows = records as { id: string }[];
		const counts = await DepartmentsRepository.countMembers(
			rows.map((row) => row.id)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_departments_success",
				message: "Departments retrieved successfully.",
				data: paginatedData({
					records: rows.map((row) => ({
						...row,
						membersCount: counts.get(row.id) ?? 0,
					})),
					pagination,
				}),
			})
		);
	}

	static async getDepartment({
		userJwt,
		subdomain,
		departmentId,
		response,
	}: Scoped & { departmentId: string }) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		return DepartmentsService.sendDetail(response, {
			status: 200,
			code: "get_department_success",
			message: "Department retrieved successfully.",
			data: await DepartmentsService.detail(departmentId, companyId),
		});
	}

	static async createDepartment({
		userJwt,
		subdomain,
		data,
		response,
	}: Scoped & { data: z.infer<typeof createDepartmentSchema> }) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		await DepartmentsService.assertNameFree(companyId, data.name);
		const departmentId = await DepartmentsRepository.insertDepartment({
			companyId,
			name: data.name,
		});

		return DepartmentsService.sendDetail(response, {
			status: 201,
			code: "create_department_success",
			message: "Department created successfully.",
			data: await DepartmentsService.detail(departmentId, companyId),
		});
	}

	/** Rename it and/or change its leader, who must be one of its members. */
	static async patchDepartment({
		userJwt,
		subdomain,
		departmentId,
		data,
		response,
	}: Scoped & {
		departmentId: string;
		data: z.infer<typeof patchDepartmentSchema>;
	}) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		await DepartmentsService.assertOwnDepartment(departmentId, companyId);
		if (data.name) {
			await DepartmentsService.assertNameFree(
				companyId,
				data.name,
				departmentId
			);
		}
		if (
			data.leaderId &&
			!(await DepartmentsRepository.isMember(departmentId, data.leaderId))
		) {
			throw new AppError("DEPARTMENT_LEADER_NOT_MEMBER");
		}
		if (Object.keys(data).length > 0) {
			await DepartmentsRepository.updateDepartment(departmentId, data);
		}

		return DepartmentsService.sendDetail(response, {
			status: 200,
			code: "patch_department_success",
			message: "Department updated successfully.",
			data: await DepartmentsService.detail(departmentId, companyId),
		});
	}

	static async deleteDepartment({
		userJwt,
		subdomain,
		departmentId,
		response,
	}: Scoped & { departmentId: string }) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		await DepartmentsService.assertOwnDepartment(departmentId, companyId);
		await DepartmentsRepository.deleteDepartment(departmentId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_department_success",
				message: "Department deleted successfully.",
				data: null,
			})
		);
	}

	static async addMembers({
		userJwt,
		subdomain,
		departmentId,
		data,
		response,
	}: Scoped & {
		departmentId: string;
		data: z.infer<typeof addDepartmentMembersSchema>;
	}) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		await DepartmentsService.assertOwnDepartment(departmentId, companyId);
		const employeeIds = [...new Set(data.employeeIds)];
		if (
			(await DepartmentsRepository.countEmployeesOfCompany(
				employeeIds,
				companyId
			)) !== employeeIds.length
		) {
			throw new AppError("DEPARTMENT_EMPLOYEE_NOT_FOUND");
		}
		await DepartmentsRepository.addMembers(departmentId, employeeIds);

		return DepartmentsService.sendDetail(response, {
			status: 200,
			code: "add_department_members_success",
			message: "Employees added to the department successfully.",
			data: await DepartmentsService.detail(departmentId, companyId),
		});
	}

	static async removeMember({
		userJwt,
		subdomain,
		departmentId,
		employeeId,
		response,
	}: Scoped & { departmentId: string; employeeId: string }) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		await DepartmentsService.assertOwnDepartment(departmentId, companyId);
		await DepartmentsRepository.removeMember(departmentId, employeeId);

		return DepartmentsService.sendDetail(response, {
			status: 200,
			code: "remove_department_member_success",
			message: "Employee removed from the department successfully.",
			data: await DepartmentsService.detail(departmentId, companyId),
		});
	}

	/** Set every department of one employee (the employees screen). */
	static async putEmployeeDepartments({
		userJwt,
		subdomain,
		employeeId,
		data,
		response,
	}: Scoped & {
		employeeId: string;
		data: z.infer<typeof putEmployeeDepartmentsSchema>;
	}) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);
		if (
			!(await DepartmentsRepository.queryEmployeeOfCompany(
				employeeId,
				companyId
			))
		) {
			throw new AppError("DEPARTMENT_EMPLOYEE_NOT_FOUND");
		}
		const departmentIds = [...new Set(data.departmentIds)];
		if (
			(await DepartmentsRepository.countDepartmentsOfCompany(
				departmentIds,
				companyId
			)) !== departmentIds.length
		) {
			throw new AppError("DEPARTMENT_NOT_FOUND");
		}
		await DepartmentsRepository.replaceEmployeeDepartments(
			employeeId,
			departmentIds
		);
		const byEmployee = await DepartmentsRepository.queryEmployeesDepartments([
			employeeId,
		]);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "put_employee_departments_success",
				message: "Employee departments updated successfully.",
				data: byEmployee.get(employeeId) ?? [],
			})
		);
	}

	static async listStageOwners({ userJwt, subdomain, response }: Scoped) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_stage_owners_success",
				message: "Stage owners retrieved successfully.",
				data: await DepartmentsRepository.queryStageOwners(companyId),
			})
		);
	}

	/**
	 * Replace which department receives an order at each stage, and who inside
	 * it; a stage left out has none. An employee must be a member of the stage's
	 * department.
	 */
	static async putStageOwners({
		userJwt,
		subdomain,
		data,
		response,
	}: Scoped & { data: z.infer<typeof putStageOwnersSchema> }) {
		const companyId = DepartmentsService.resolveCompanyId(userJwt, subdomain);

		const departmentIds = [
			...new Set(data.stages.map((stage) => stage.departmentId)),
		];
		const departmentsFound =
			await DepartmentsRepository.countDepartmentsOfCompany(
				departmentIds,
				companyId
			);
		const members = await Promise.all(
			data.stages.map((stage) =>
				stage.assigneeMode === "employee" && stage.employeeId
					? DepartmentsRepository.isMember(stage.departmentId, stage.employeeId)
					: true
			)
		);
		if (departmentsFound !== departmentIds.length || members.includes(false)) {
			throw new AppError("DEPARTMENT_STAGE_OWNER_INVALID");
		}

		await inTransaction((tx) =>
			DepartmentsRepository.replaceStageOwners(tx, companyId, data.stages)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "put_stage_owners_success",
				message: "Stage owners updated successfully.",
				data: await DepartmentsRepository.queryStageOwners(companyId),
			})
		);
	}
}
