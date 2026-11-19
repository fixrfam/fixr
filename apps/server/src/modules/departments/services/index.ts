import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createSectorSchema,
	putStageOwnersSchema,
	setEmployeeSectorSchema,
} from "@fixr/schemas/sectors";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { inTransaction } from "../../../core/lib/transaction";
import { SectorsRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Business logic for sectors and the default owner of each stage */
export class SectorsService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("SECTOR_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("SECTOR_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	private static async assertOwnSector(sectorId: string, companyId: string) {
		const sector = await SectorsRepository.querySectorOfCompany(
			sectorId,
			companyId
		);
		if (!sector) {
			throw new AppError("SECTOR_NOT_FOUND");
		}
		return sector;
	}

	private static async assertNameFree(
		companyId: string,
		name: string,
		sectorId?: string
	) {
		const existing = await SectorsRepository.querySectorByName(companyId, name);
		if (existing && existing.id !== sectorId) {
			throw new AppError("SECTOR_NAME_CONFLICT");
		}
	}

	private static async sendSectors(
		response: FastifyReply,
		companyId: string,
		{
			status,
			code,
			message,
		}: { status: 200 | 201; code: string; message: string }
	) {
		return response.status(status).send(
			apiResponse({
				status,
				error: null,
				code,
				message,
				data: await SectorsRepository.querySectorsWithEmployees(companyId),
			})
		);
	}

	static listSectors({
		userJwt,
		subdomain,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);
		return SectorsService.sendSectors(response, companyId, {
			status: 200,
			code: "list_sectors_success",
			message: "Sectors retrieved successfully.",
		});
	}

	static async createSector({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createSectorSchema>;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);
		await SectorsService.assertNameFree(companyId, data.name);
		await SectorsRepository.insertSector({ companyId, name: data.name });

		return SectorsService.sendSectors(response, companyId, {
			status: 201,
			code: "create_sector_success",
			message: "Sector created successfully.",
		});
	}

	static async renameSector({
		userJwt,
		subdomain,
		sectorId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		sectorId: string;
		data: z.infer<typeof createSectorSchema>;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);
		await SectorsService.assertOwnSector(sectorId, companyId);
		await SectorsService.assertNameFree(companyId, data.name, sectorId);
		await SectorsRepository.updateSector(sectorId, data.name);

		return SectorsService.sendSectors(response, companyId, {
			status: 200,
			code: "patch_sector_success",
			message: "Sector updated successfully.",
		});
	}

	/** Its employees and orders are left without a sector; its stages, without a default sector. */
	static async deleteSector({
		userJwt,
		subdomain,
		sectorId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		sectorId: string;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);
		await SectorsService.assertOwnSector(sectorId, companyId);
		await SectorsRepository.deleteSector(sectorId);

		return SectorsService.sendSectors(response, companyId, {
			status: 200,
			code: "delete_sector_success",
			message: "Sector deleted successfully.",
		});
	}

	static async setEmployeeSector({
		userJwt,
		subdomain,
		employeeId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		employeeId: string;
		data: z.infer<typeof setEmployeeSectorSchema>;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);
		const employee = await SectorsRepository.queryEmployeeOfCompany(
			employeeId,
			companyId
		);
		if (!employee) {
			throw new AppError("SECTOR_EMPLOYEE_NOT_FOUND");
		}
		if (data.sectorId) {
			await SectorsService.assertOwnSector(data.sectorId, companyId);
		}
		await SectorsRepository.updateEmployeeSector(employeeId, data.sectorId);

		return SectorsService.sendSectors(response, companyId, {
			status: 200,
			code: "set_employee_sector_success",
			message: "Employee moved to the sector successfully.",
		});
	}

	static async listStageOwners({
		userJwt,
		subdomain,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_stage_owners_success",
				message: "Stage owners retrieved successfully.",
				data: await SectorsRepository.queryStageOwners(companyId),
			})
		);
	}

	/** Replace the default owner of every stage; a stage left out has none. */
	static async putStageOwners({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof putStageOwnersSchema>;
		response: FastifyReply;
	}) {
		const companyId = SectorsService.resolveCompanyId(userJwt, subdomain);

		const sectorIds = [
			...new Set(data.stages.flatMap((stage) => stage.sectorId ?? [])),
		];
		const employeeIds = [
			...new Set(data.stages.flatMap((stage) => stage.employeeId ?? [])),
		];
		const [sectorsFound, employeesFound] = await Promise.all([
			SectorsRepository.countSectorsOfCompany(sectorIds, companyId),
			SectorsRepository.countEmployeesOfCompany(employeeIds, companyId),
		]);
		if (
			sectorsFound !== sectorIds.length ||
			employeesFound !== employeeIds.length
		) {
			throw new AppError("SECTOR_STAGE_OWNER_INVALID");
		}

		await inTransaction((tx) =>
			SectorsRepository.replaceStageOwners(tx, companyId, data.stages)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "put_stage_owners_success",
				message: "Stage owners updated successfully.",
				data: await SectorsRepository.queryStageOwners(companyId),
			})
		);
	}
}
