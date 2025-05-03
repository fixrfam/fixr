import { getPaginatedDataSchema, paginatedDataSchema } from "@repo/schemas/utils";
import { FastifySchema } from "fastify";
import { zodResponseSchema } from "../../types";
import { employeeSelectSchema } from "@repo/db/schema";
import { getCompanyNestedDataSchema } from "@repo/schemas/companies";

const getCompanyEmployeesSchema: FastifySchema = {
    tags: ["Companies/Employees"],
    description: `
**Retrieves specified company employees**

The data returned is paginated. See the [pagination](/docs/#description/pagination) section for more details on how to interact with it.`,
    summary: "Get employees",
    params: getCompanyNestedDataSchema,
    querystring: getPaginatedDataSchema,
    response: {
        200: zodResponseSchema({
            status: 200,
            error: null,
            message: "Company employees successfully retrieved.",
            code: "get_company_employees_success",
            data: paginatedDataSchema(employeeSelectSchema),
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

export const employeesDocs = { getCompanyEmployeesSchema };
