import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createSectorSchema,
	putStageOwnersSchema,
	setEmployeeSectorSchema,
} from "@fixr/schemas/sectors";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { SectorsService } from "../services";

interface Scoped {
	userJwt: z.infer<typeof jwtPayload>;
	subdomain: string;
	response: FastifyReply;
}

/** @description Sectors request handlers */
export class SectorsController {
	static listSectors(params: Scoped) {
		return SectorsService.listSectors(params);
	}

	static createSector(
		params: Scoped & { data: z.infer<typeof createSectorSchema> }
	) {
		return SectorsService.createSector(params);
	}

	static renameSector(
		params: Scoped & {
			sectorId: string;
			data: z.infer<typeof createSectorSchema>;
		}
	) {
		return SectorsService.renameSector(params);
	}

	static deleteSector(params: Scoped & { sectorId: string }) {
		return SectorsService.deleteSector(params);
	}

	static setEmployeeSector(
		params: Scoped & {
			employeeId: string;
			data: z.infer<typeof setEmployeeSectorSchema>;
		}
	) {
		return SectorsService.setEmployeeSector(params);
	}

	static listStageOwners(params: Scoped) {
		return SectorsService.listStageOwners(params);
	}

	static putStageOwners(
		params: Scoped & { data: z.infer<typeof putStageOwnersSchema> }
	) {
		return SectorsService.putStageOwners(params);
	}
}
