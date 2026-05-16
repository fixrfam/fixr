import { t } from "elysia";
import { elysiaResponseSchema } from "../types";

const errorResponse = t.Object({
	status: t.Number(),
	error: t.Union([t.String(), t.Null()]),
	message: t.String(),
	code: t.String(),
	data: t.Union([t.Null(), t.Any()]),
});

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
		401: errorResponse,
		403: errorResponse,
		404: errorResponse,
		500: errorResponse,
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
		401: errorResponse,
		403: errorResponse,
		404: errorResponse,
		500: errorResponse,
	},
};

export const companiesDocs = {
	getUserCompanySchema,
	getCompanyByIdSchema: getCompanyBySubdomainSchema,
};
