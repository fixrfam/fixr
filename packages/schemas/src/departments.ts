import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { serviceOrderStatuses } from "./service-orders";

/** @description Body schema for creating or renaming a sector */
export const createSectorSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, i18nMessage("validation.name.required"))
		.max(80, i18nMessage("validation.name.atMost", { count: 80 })),
});

export const patchSectorSchema = createSectorSchema;

/** @description Params schema for routes that target a single sector */
export const sectorIdParamsSchema = z.object({
	sectorId: z.string().cuid2(),
});

const sectorId = z
	.string()
	.cuid2({ message: i18nMessage("validation.sector.invalid") })
	.nullable();

/**
 * @description Body schema for setting who is responsible for each stage of a
 * service order by default. A stage left out, or with neither a sector nor an
 * employee, has no default: the order stays where it was.
 */
export const putStageOwnersSchema = z.object({
	stages: z
		.array(
			z.object({
				status: serviceOrderStatuses,
				sectorId,
				employeeId: z
					.string()
					.cuid2({
						message: i18nMessage("validation.serviceOrder.assigneeInvalid"),
					})
					.nullable(),
			})
		)
		.refine(
			(stages) =>
				new Set(stages.map((stage) => stage.status)).size === stages.length,
			{ message: i18nMessage("validation.sector.stageRepeated") }
		),
});

/** @description Params schema for the route that moves an employee to a sector */
export const sectorEmployeeParamsSchema = z.object({
	employeeId: z.string().cuid2(),
});

/** @description Body schema for moving an employee to a sector (null: none) */
export const setEmployeeSectorSchema = z.object({
	sectorId,
});
