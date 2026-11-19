import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the departments module */
export const departmentsErrors = defineErrors({
	DEPARTMENT_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	DEPARTMENT_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	DEPARTMENT_NOT_FOUND: {
		code: "department_not_found",
		message: "Department not found.",
		status: 404,
	},
	DEPARTMENT_NAME_CONFLICT: {
		code: "department_name_conflict",
		message: "A department with this name already exists in this company.",
		status: 409,
	},
	DEPARTMENT_EMPLOYEE_NOT_FOUND: {
		code: "department_employee_not_found",
		message: "The employee does not exist in this company.",
		status: 404,
	},
	DEPARTMENT_LEADER_NOT_MEMBER: {
		code: "department_leader_not_member",
		message: "The leader must be a member of the department.",
		status: 400,
	},
	DEPARTMENT_STAGE_OWNER_INVALID: {
		code: "department_stage_owner_invalid",
		message:
			"A stage's department does not exist in this company, or its employee is not a member of it.",
		status: 400,
	},
	DEPARTMENT_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
