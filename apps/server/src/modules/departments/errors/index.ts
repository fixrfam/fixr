import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the sectors module */
export const sectorsErrors = defineErrors({
	SECTOR_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	SECTOR_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	SECTOR_NOT_FOUND: {
		code: "sector_not_found",
		message: "Sector not found.",
		status: 404,
	},
	SECTOR_NAME_CONFLICT: {
		code: "sector_name_conflict",
		message: "A sector with this name already exists in this company.",
		status: 409,
	},
	SECTOR_EMPLOYEE_NOT_FOUND: {
		code: "sector_employee_not_found",
		message: "The employee does not exist in this company.",
		status: 404,
	},
	SECTOR_STAGE_OWNER_INVALID: {
		code: "sector_stage_owner_invalid",
		message: "A stage's sector or employee does not exist in this company.",
		status: 400,
	},
});
