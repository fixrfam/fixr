import { t } from "elysia";
import {
	elysiaResponseSchema,
	errorResponse,
	errorResponses,
} from "../../types";

const employeeSchema = t.Object({
	id: t.String(),
	name: t.String(),
	cpf: t.String(),
	phone: t.Union([t.String(), t.Null()]),
	role: t.Union([
		t.Literal("admin"),
		t.Literal("manager"),
		t.Literal("technician"),
		t.Literal("warehouse"),
		t.Literal("financial"),
	]),
	createdAt: t.String(),
	userId: t.String(),
	companyId: t.String(),
	account: t.Object({
		id: t.String(),
		email: t.String(),
		avatarUrl: t.Union([t.String(), t.Null()]),
		createdAt: t.String(),
		verified: t.Union([t.Boolean(), t.Null()]),
	}),
});

const paginationSchema = t.Object({
	total_records: t.Number(),
	total_pages: t.Number(),
	current_page: t.Number(),
	next_page: t.Union([t.Number(), t.Null()]),
	prev_page: t.Union([t.Number(), t.Null()]),
});

const paginatedEmployeesData = t.Object({
	records: t.Array(employeeSchema),
	pagination: paginationSchema,
});

export const getCompanyEmployeesSchema = {
	detail: {
		tags: ["Companies/Employees"],
		summary: "Get employees",
		description: `
**Retrieves specified company employees**

The data returned is paginated. See the [pagination](/docs/#description/pagination) section for more details on how to interact with it.`,
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Company employees successfully retrieved.",
			code: "get_company_employees_success",
			data: paginatedEmployeesData,
		}),
		401: errorResponse("AUTH_JWT_INVALID"),
		403: errorResponses("EMPLOYEE_NOT_ALLOWED", "RESOURCE_FORBIDDEN"),
		404: errorResponses("EMPLOYEE_COMPANY_NOT_FOUND", "RESOURCE_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

export const registerEmployeeSchema = {
	detail: {
		tags: ["Companies/Employees"],
		summary: "Register employee",
		description: `
**Register an employee on the system**

When an employee is registered, an email with the provided/generated password is sent to the employee mailbox.,

Rules:
- Only company \`managers\` or \`admins\` can register employees.
- Managers can only register \`technicians\` and \`managers\`, not \`admins\`.
`,
	},
	response: {
		201: elysiaResponseSchema({
			status: 201,
			error: null,
			message: "Employee created successfully.",
			code: "create_employee_success",
			data: null,
		}),
		400: errorResponse("BAD_REQUEST"),
		401: errorResponse("AUTH_JWT_INVALID"),
		403: errorResponses(
			"RESOURCE_FORBIDDEN",
			"EMPLOYEE_NOT_ALLOWED",
			"EMPLOYEE_VIOLATES_ROLE_HIERARCHY"
		),
		409: errorResponses("EMPLOYEE_EMAIL_ALREADY_USED", "EMPLOYEE_CPF_CONFLICT"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

export const employeesDocs = {
	getCompanyEmployeesSchema,
	registerEmployeeSchema,
};
