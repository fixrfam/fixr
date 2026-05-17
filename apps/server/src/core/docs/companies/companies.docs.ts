import { t } from "elysia";
import { elysiaResponseSchema, errorResponse, errorResponses } from "../types";

const companySchema = t.Object({
	id: t.String(),
	name: t.String(),
	cnpj: t.String(),
	address: t.Union([t.String(), t.Null()]),
	subdomain: t.String(),
	createdAt: t.String(),
});

export const getUserCompanySchema = {
	detail: {
		tags: ["Companies"],
		summary: "Get user company",
		description: "Retrieves user company",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Company retrieved successfully.",
			code: "get_company_success",
			data: companySchema,
		}),
		401: errorResponse("AUTH_JWT_INVALID"),
		403: errorResponse("RESOURCE_FORBIDDEN"),
		404: errorResponse("COMPANY_USER_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

export const getCompanyBySubdomainSchema = {
	detail: {
		tags: ["Companies"],
		summary: "Get company by subdomain",
		description:
			"Retrieves the specified company. The user can only retrieve companies it belongs to.",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Company retrieved successfully.",
			code: "get_company_success",
			data: companySchema,
		}),
		401: errorResponse("AUTH_JWT_INVALID"),
		403: errorResponses("COMPANY_NOT_ALLOWED", "RESOURCE_FORBIDDEN"),
		404: errorResponse("COMPANY_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

export const companiesDocs = {
	getUserCompanySchema,
	getCompanyByIdSchema: getCompanyBySubdomainSchema,
};
