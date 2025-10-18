import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema, paginatedDataSchema } from "@fixr/schemas/utils";
import { FastifySchema } from "fastify";
import { zodResponseSchema } from "../../types";
import { employeeSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { z } from "zod";
import { accountSchema } from "@fixr/schemas/account";

const getCompanyEmployeesSchema: FastifySchema = {
    tags: ["Companies/Employees"],
    summary: "Get employees",
    description: `
**Retrieves specified company employees**

The data returned is paginated. See the [pagination](/docs/#description/pagination) section for more details on how to interact with it.`,
    params: getCompanyNestedDataSchema,
    querystring: getPaginatedDataSchema,
    response: {
        200: zodResponseSchema({
            status: 200,
            error: null,
            message: "Company employees successfully retrieved.",
            code: "get_company_employees_success",
            data: paginatedDataSchema(
                employeeSelectSchema.extend({
                    account: accountSchema.pick({
                        id: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true,
                    }),
                })
            ),
        }).describe("Presentations retrieved successfully."),
        416: zodResponseSchema({
            status: 416,
            error: "Range Not Satisfiable",
            code: "page_out_of_bounds",
            message: "The requested page exceeds the total number of pages.",
            data: null,
        }).describe(
            "The requested page exceeds the total number of pages (out of page_out_of_bounds)."
        ),
        403: zodResponseSchema({
            status: 403,
            error: "Forbidden",
            code: "not_allowed",
            message: "You are not allowed to access this company.",
            data: null,
        }).describe("You are not allowed to access this company."),
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "company_not_found",
            message: "There's no companies bound to your account",
            data: null,
        }).describe("Couldn't find any company user belongs to."),
    },
    security: [{ JWT: [] }],
};

const registerEmployeeSchema: FastifySchema = {
    tags: ["Companies/Employees"],
    summary: "Register employee",
    description: `
**Register an employee on the system**

When an employee is registered, an email with the provided/generated password is sent to the employee mailbox.,

Rules: 
- Only company \`managers\` or \`admins\` can register employees.
- Managers can only register \`technicians\` and \`managers\`, not \`admins\`.
`,
    params: getCompanyNestedDataSchema,
    body: createEmployeeSchema,
    response: {
        201: zodResponseSchema({
            status: 201,
            error: null,
            code: "create_employee_success",
            message: "Employee created successfully.",
            data: null,
        }).describe("Employee was created and invitation email was sent."),
        403: z
            .union([
                z
                    .object({
                        status: z.literal(403),
                        error: z.literal("Forbidden"),
                        code: z.literal("not_allowed"),
                        message: z.literal("You are not allowed to perform this action."),
                        data: z.literal(null),
                    })
                    .describe(
                        "You are either not a manager/admin or not associated to the company."
                    ),
                z
                    .object({
                        status: z.literal(403),
                        error: z.literal("Forbidden"),
                        code: z.literal("violates_role_hierarchy"),
                        message: z.literal("Managers may only create subordinate accounts."),
                        data: z.literal(null),
                    })
                    .describe("Managers may only create subordinate accounts."),
            ])
            .describe("User is not allowed to perform this action."),
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "company_not_found",
            message: "There's no companies bound to your account",
            data: null,
        }).describe("User is not associated with the target company."),
        409: z
            .union([
                z
                    .object({
                        status: z.literal(409),
                        error: z.literal("Conflict"),
                        code: z.literal("email_already_used"),
                        message: z.literal("Email is already registered."),
                        data: z.literal(null),
                    })
                    .describe("Email is already registered."),
                z
                    .object({
                        status: z.literal(409),
                        error: z.literal("Conflict"),
                        code: z.literal("cpf_conflict"),
                        message: z.literal("Cpf is already registered."),
                        data: z.literal(null),
                    })
                    .describe("CPF is already registered."),
            ])
            .describe("Email or CPF is already registered."),
    },
    security: [{ JWT: [] }],
};

export const employeesDocs = { getCompanyEmployeesSchema, registerEmployeeSchema };
