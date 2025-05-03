import { FastifySchema } from "fastify";
import { zodResponseSchema } from "../types";
import { companySelectSchema } from "@repo/db/schema";
import { getCompanyByIdSchema as getCompanyByIdParamsSchema } from "@repo/schemas/companies";
import { z } from "zod";

const getUserCompanySchema: FastifySchema = {
    tags: ["Companies"],
    summary: "Get user company",
    description: `Retrieves user company`,
    response: {
        404: zodResponseSchema({
            status: 404,
            error: null,
            code: "company_not_found",
            message: "Couldn't find any company you belong to.",
            data: null,
        }).describe("Couldn't find any company user belongs to."),
        200: zodResponseSchema({
            status: 200,
            error: null,
            code: "get_company_success",
            message: "Company retrieved successfully.",
            data: companySelectSchema,
        }).describe("Company retrieved successfully"),
    },
    security: [{ JWT: [] }],
};

const getCompanyByIdSchema: FastifySchema = {
    tags: ["Companies"],
    summary: "Get company by ID.",
    description: `Retrieves the specified company. The user can only retrieve companies it belongs to.`,
    params: getCompanyByIdParamsSchema,
    response: {
        403: zodResponseSchema({
            status: 403,
            error: "Forbidden",
            code: "not_allowed",
            message: "You are not authorized to access this company.",
            data: null,
        }).describe("You are not allowed to access this company."),
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "company_not_found",
            message: "Company not found",
            data: null,
        }).describe("Couldn't find any company user belongs to."),
        200: zodResponseSchema({
            status: 200,
            error: null,
            code: "get_company_success",
            message: "Company retrieved successfully.",
            data: companySelectSchema,
        }).describe("Company retrieved successfully"),
    },
    security: [{ JWT: [] }],
};

export const companiesDocs = { getUserCompanySchema, getCompanyByIdSchema };
